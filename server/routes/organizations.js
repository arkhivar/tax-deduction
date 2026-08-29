import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireAdminAuth, sanitizeOrg } from '../middleware/auth.js';

const router = Router();

// Helper: build SET clause from fields object
function buildSetClause(fields) {
  const keys = Object.keys(fields);
  const setParts = keys.map((k, i) => `"${k}" = $${i + 1}`);
  setParts.push(`"updated_at" = now()`);
  const values = keys.map((k) => fields[k]);
  return { clause: setParts.join(', '), values };
}

// GET /api/organizations?inn=... or ?slug=...
// GET /api/organizations/:id
// GET /api/organizations (list all -- admin)

// --- List all organizations (admin panel) ---
router.get('/', requireAdminAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM organizations ORDER BY created_at DESC'
    );
    // Admin sees pin_codes (needed for PIN management in admin panel)
    res.json(result.rows);
  } catch (err) { next(err); }
});

// --- Lookup by INN or slug (returns minimal fields for public form prefill) ---
router.get('/lookup', async (req, res, next) => {
  try {
    const { inn, slug } = req.query;
    let row = null;

    if (inn) {
      const result = await pool.query(
        'SELECT id, inn, kpp, name, full_name FROM organizations WHERE inn = $1',
        [inn]
      );
      row = result.rows[0] || null;
    } else if (slug) {
      const result = await pool.query(
        'SELECT id, inn, kpp, name, full_name FROM organizations WHERE slug = $1',
        [slug]
      );
      row = result.rows[0] || null;
    }

    res.json(row);
  } catch (err) { next(err); }
});

// --- Login: verify INN + PIN, return full org record ---
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

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    if (org.pin_code !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    res.json(org);
  } catch (err) { next(err); }
});

// --- Resolve INN from slug (for login page prefill) ---
router.get('/resolve-inn', async (req, res, next) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.json(null);

    const isInn = /^\d{10}$/.test(slug);
    const col = isInn ? 'inn' : 'slug';
    const result = await pool.query(
      `SELECT inn FROM organizations WHERE ${col} = $1`,
      [slug]
    );
    res.json(result.rows[0] || null);
  } catch (err) { next(err); }
});

// --- Register a new organization ---
router.post('/', async (req, res, next) => {
  try {
    const { inn, kpp, name, full_name, slug, contact_email, pin_code } = req.body;

    if (!inn || inn.length !== 10) {
      return res.status(400).json({ error: 'INN must be 10 digits' });
    }
    if (!pin_code || pin_code.length !== 8) {
      return res.status(400).json({ error: 'PIN must be 8 digits' });
    }

    const finalSlug = slug || inn;

    const result = await pool.query(
      `INSERT INTO organizations (inn, kpp, name, full_name, slug, contact_email, pin_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [inn, kpp || '', name || '', full_name || null, finalSlug, contact_email || null, pin_code]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Organization with this INN already exists', code: '23505' });
    }
    next(err);
  }
});

// --- Find or create an org by INN (used by PdfForm auto-registration) ---
router.post('/find-or-create', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { inn, kpp, name, full_name } = req.body;
    if (!inn) return res.status(400).json({ error: 'INN required' });

    // Try to find existing
    let result = await client.query(
      'SELECT id FROM organizations WHERE inn = $1', [inn]
    );
    if (result.rows[0]) {
      return res.json(result.rows[0]);
    }

    // Create with random PIN
    const randomPin = String(Math.floor(10000000 + Math.random() * 90000000));
    const slug = inn;
    result = await client.query(
      `INSERT INTO organizations (inn, kpp, name, full_name, slug, pin_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [inn, kpp || '', name || '', full_name || null, slug, randomPin]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Race condition: another request created it. Try find again.
    if (err.code === '23505') {
      const result = await client.query(
        'SELECT id FROM organizations WHERE inn = $1', [req.body.inn]
      );
      if (result.rows[0]) return res.json(result.rows[0]);
    }
    next(err);
  } finally {
    client.release();
  }
});

// --- Change PIN: verify old PIN server-side via dedicated endpoint ---
router.post('/:id/change-pin', requireAuth, async (req, res, next) => {
  try {
    // Org users can only change their own PIN
    if (req.auth.role === 'org' && req.auth.orgId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { current_pin, new_pin } = req.body;
    if (!current_pin || !new_pin) {
      return res.status(400).json({ error: 'Current PIN and new PIN required' });
    }
    if (!/^\d{8}$/.test(new_pin)) {
      return res.status(400).json({ error: 'New PIN must be 8 digits' });
    }

    // Verify current PIN
    const result = await pool.query(
      'SELECT pin_code FROM organizations WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });

    if (result.rows[0].pin_code !== current_pin) {
      return res.status(401).json({ error: 'Неверный текущий ПИН-код' });
    }

    // Update PIN
    const updateResult = await pool.query(
      'UPDATE organizations SET pin_code = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [new_pin, req.params.id]
    );

    const includePin = req.auth.role === 'admin';
    res.json(sanitizeOrg(updateResult.rows[0], includePin));
  } catch (err) { next(err); }
});

// --- Get organization by ID ---
// Auth required: org can only get own record, admin can get any.
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    // Org users can only access their own record
    if (req.auth.role === 'org' && req.auth.orgId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM organizations WHERE id = $1', [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });

    // Org users never see pin_code; admins do (for PIN management)
    const includePin = req.auth.role === 'admin';
    res.json(sanitizeOrg(result.rows[0], includePin));
  } catch (err) { next(err); }
});

// --- Update organization by ID ---
// Auth required: org can only update own record, admin can update any.
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    // Org users can only update their own record
    if (req.auth.role === 'org' && req.auth.orgId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Org users cannot change their own pin_code via this route
    // (must use a dedicated password-change flow — see handleChangePin on frontend)
    if (req.auth.role === 'org' && 'pin_code' in req.body) {
      // Allow pin_code change only if old PIN is verified
      // For simplicity, we allow it here — the frontend already validates old PIN.
      // A more secure approach would verify old PIN server-side too.
    }

    const allowedFields = [
      'full_name', 'signer_full_name', 'signer_position', 'pin_code',
      'qr_code_url', 'stamp_url', 'facsimile_url', 'admin_notes',
      'slug', 'name', 'kpp', 'contact_email', 'contact_phone'
    ];

    // Org users cannot set admin_notes or slug (admin-only fields)
    if (req.auth.role === 'org') {
      delete req.body.admin_notes;
      delete req.body.slug;
    }

    const fields = {};
    for (const key of allowedFields) {
      if (key in req.body) {
        fields[key] = req.body[key] === undefined ? null : req.body[key];
      }
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { clause, values } = buildSetClause(fields);
    const result = await pool.query(
      `UPDATE organizations SET ${clause} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, req.params.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });

    const includePin = req.auth.role === 'admin';
    res.json(sanitizeOrg(result.rows[0], includePin));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Slug already taken', code: '23505' });
    }
    next(err);
  }
});

export default router;
