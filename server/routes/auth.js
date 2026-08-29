import { Router } from 'express';
import { pool } from '../db/pool.js';
import { signOrgToken, signAdminToken, sanitizeOrg, requireAuth } from '../middleware/auth.js';

const router = Router();

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
      return res.status(401).json({ error: 'Неверный ИНН или ПИН-код' });
    }

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
    return res.status(401).json({ error: 'Invalid credentials' });
  }

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
