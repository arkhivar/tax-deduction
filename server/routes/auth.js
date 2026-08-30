import { Router } from 'express';
import { pool } from '../db/pool.js';
import { signOrgToken, signAdminToken, sanitizeOrg, requireAuth } from '../middleware/auth.js';

const router = Router();

// Behind nginx: real client IP comes from X-Forwarded-For
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  return (typeof xff === 'string' ? xff.split(',')[0].trim() : req.ip) || null;
}

// Fire-and-forget audit log; never blocks or breaks the login flow
function logLogin({ role, orgId = null, inn = null, success, ip }) {
  pool.query(
    'INSERT INTO login_events (role, org_id, inn, success, ip) VALUES ($1, $2, $3, $4, $5)',
    [role, orgId, inn, success, ip]
  ).catch((err) => console.error('[auth] login event log failed:', err.message));
}

/**
 * POST /api/auth/login
 * Organization login: verify INN + PIN, return JWT + sanitized org data.
 *
 * Response: { token, org } where org excludes pin_code.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { inn, pin } = req.body;
    if (!inn || !pin) {
      return res.status(400).json({ error: 'INN and PIN required' });
    }

    const result = await pool.query(
      'SELECT * FROM organizations WHERE inn = $1',
      [inn]
    );
    const org = result.rows[0];

    // Use generic error message to prevent org enumeration
    if (!org || org.pin_code !== pin) {
      logLogin({ role: 'org', orgId: org?.id || null, inn, success: false, ip: clientIp(req) });
      return res.status(401).json({ error: 'Неверный ИНН или ПИН-код' });
    }

    logLogin({ role: 'org', orgId: org.id, inn, success: true, ip: clientIp(req) });
    pool.query('UPDATE organizations SET last_login_at = now() WHERE id = $1', [org.id])
      .catch((err) => console.error('[auth] last_login_at update failed:', err.message));

    const token = signOrgToken(org.id);
    res.json({ token, org: sanitizeOrg(org) });
  } catch (err) { next(err); }
});

/**
 * POST /api/auth/admin
 * Admin login: verify password, return JWT with admin role.
 *
 * Response: { token }
 */
router.post('/admin', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    logLogin({ role: 'admin', success: false, ip: clientIp(req) });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  logLogin({ role: 'admin', success: true, ip: clientIp(req) });
  const token = signAdminToken();
  res.json({ token });
});

/**
 * GET /api/auth/me
 * Verify current token and return the org data (for session restore on page reload).
 *
 * Requires: Bearer token (org or admin).
 * For org tokens: returns the full org record (minus pin_code).
 * For admin tokens: returns { role: 'admin' }.
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (req.auth.role === 'admin') {
      return res.json({ role: 'admin' });
    }

    // Org token — fetch current org data
    const result = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [req.auth.orgId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ role: 'org', org: sanitizeOrg(result.rows[0]) });
  } catch (err) { next(err); }
});

export default router;
