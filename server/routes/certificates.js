import { Router } from 'express';
import puppeteer from 'puppeteer';
import { pool } from '../db/pool.js';
import { requireAuth, requireOrgAuth, requireAdminAuth, signOrgToken } from '../middleware/auth.js';

const router = Router();

// --- Shared headless Chrome for server-side PDF rendering ---
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    browserPromise
      .then((b) => b.on('disconnected', () => { browserPromise = null; }))
      .catch(() => { browserPromise = null; });
  }
  return browserPromise;
}

// Generate the daily certificate number: yy-mm-dd-NNN (ordinal of the day).
// Runs inside the caller's transaction; the advisory lock serializes
// concurrent inserts so ordinals never collide.
async function generateCertificateNumber(client) {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext('cert-num-' || CURRENT_DATE::text))`);
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM education_certificates WHERE created_at::date = CURRENT_DATE`
  );
  const ordinal = String(rows[0].n + 1).padStart(3, '0');
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}-${ordinal}`;
}

// --- Download certificate as PDF ---
// Auth required: org can only download own certs, admin any.
// Renders the existing /org/print/:id page in headless Chrome (the caller's
// token is injected into localStorage so the SPA session restores), then
// returns Chrome's print-to-PDF output — identical to manual Print → Save as PDF.
router.get('/:id/pdf', requireAuth, async (req, res, next) => {
  try {
    const certRes = await pool.query(
      `SELECT org_id, report_year,
              taxpayer_last_name, taxpayer_first_name, taxpayer_patronymic
       FROM education_certificates WHERE id = $1`,
      [req.params.id]
    );
    const cert = certRes.rows[0];
    if (!cert) return res.status(404).json({ error: 'Not found' });
    if (req.auth.role === 'org' && cert.org_id !== req.auth.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // The print page requires an org session; admins get a scoped token for the cert's org
    let token = req.headers.authorization.slice(7);
    if (req.auth.role === 'admin') {
      if (!cert.org_id) return res.status(400).json({ error: 'Certificate is not linked to an organization' });
      token = signOrgToken(cert.org_id);
    }

    const base = process.env.PUBLIC_ORIGIN || 'https://xn--b1ag3bst.help';
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.evaluateOnNewDocument((t) => {
        try { localStorage.setItem('knd_token', t); } catch { /* ignore */ }
      }, token);
      await page.goto(`${base}/org/print/${req.params.id}`, { waitUntil: 'networkidle0', timeout: 45000 });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      const cap = (s) => (s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : '');
      const initial = (s) => (s || '').trim().charAt(0).toUpperCase();
      const nameParts = [
        cap(cert.taxpayer_last_name),
        `${initial(cert.taxpayer_first_name)}${initial(cert.taxpayer_patronymic)}`,
        'форма 1151158',
        cert.report_year ? `за ${cert.report_year}г` : '',
      ].filter(Boolean);
      const rawName = nameParts.join(' ').replace(/[/\\:*?"<>|]/g, '') || 'certificate';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="certificate.pdf"; filename*=UTF-8''${encodeURIComponent(`${rawName}.pdf`)}`
      );
      res.send(Buffer.from(pdf));
    } finally {
      await page.close();
    }
  } catch (err) { next(err); }
});

// --- List certificates (with optional org_id or status filter) ---
// Auth required: org sees only own certs, admin sees all.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    // Org users are always scoped to their own org_id
    if (req.auth.role === 'org') {
      conditions.push(`org_id = $${paramIdx++}`);
      params.push(req.auth.orgId);
    } else if (req.auth.role === 'admin') {
      // Admin can filter by org_id or status
      const { org_id, status } = req.query;
      if (org_id) {
        conditions.push(`org_id = $${paramIdx++}`);
        params.push(org_id);
      }
      if (status && status !== 'all') {
        conditions.push(`status = $${paramIdx++}`);
        params.push(status);
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM education_certificates ${where} ORDER BY created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// --- Get aggregate stats by org (admin org list) ---
router.get('/stats', requireAdminAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT org_id, COUNT(*) as total,
              COUNT(*) FILTER (WHERE status = 'draft') as pending
       FROM education_certificates
       WHERE org_id IS NOT NULL
       GROUP BY org_id`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// --- Create a draft certificate (org dashboard quick entry) ---
// Auth required: org only; org_id is forced from the token. Minimal fields
// (name + optional amount); NOT NULL columns get placeholders that the
// taxpayer or org replaces later via the complete endpoint / edit page.
router.post('/draft', requireOrgAuth, async (req, res, next) => {
  try {
    const { taxpayer_last_name, taxpayer_first_name, taxpayer_patronymic, expense_amount } = req.body;

    if (!taxpayer_last_name || !taxpayer_first_name) {
      return res.status(400).json({ error: 'taxpayer_last_name and taxpayer_first_name required' });
    }
    const amount = expense_amount === undefined || expense_amount === null || expense_amount === ''
      ? 0
      : Number(expense_amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: 'expense_amount must be a non-negative number' });
    }

    const orgResult = await pool.query(
      'SELECT inn, kpp, name, signer_full_name FROM organizations WHERE id = $1',
      [req.auth.orgId]
    );
    if (!orgResult.rows[0]) return res.status(404).json({ error: 'Organization not found' });
    const org = orgResult.rows[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const certificateNumber = await generateCertificateNumber(client);
      const result = await client.query(
        `INSERT INTO education_certificates (
           org_id, org_inn, org_kpp, org_name,
           taxpayer_last_name, taxpayer_first_name, taxpayer_patronymic,
           expense_amount,
           doc_type_code, doc_series_number, taxpayer_birth_date, doc_issue_date,
           certificate_number, signer_full_name, sign_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '21', '—', '1900-01-01', '1900-01-01', $9, $10, CURRENT_DATE)
         RETURNING *`,
        [
          req.auth.orgId, org.inn, org.kpp, org.name,
          taxpayer_last_name, taxpayer_first_name, taxpayer_patronymic || '',
          amount,
          certificateNumber,
          org.signer_full_name,
        ]
      );
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (txErr) {
      await client.query('ROLLBACK').catch(() => {});
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

// --- Get a single certificate by ID ---
// Public access: taxpayers can view their own form status via capability URL (the UUID).
// Authed access: orgs can view certs tied to their org_id, admins can view any.
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM education_certificates WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });

    // If authed as org, verify the cert belongs to their org
    // (optional check — if no auth, the capability URL IS the auth)
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// --- Create a new certificate ---
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;

    // Map date fields: empty string -> null
    const dateFields = ['taxpayer_birth_date', 'doc_issue_date', 'student_birth_date', 'student_doc_issue_date', 'sign_date'];
    for (const f of dateFields) {
      if (body[f] === '') body[f] = null;
    }

    // Validate required fields (matching original RLS policy)
    if (!body.org_inn || body.org_inn.length < 10) {
      return res.status(400).json({ error: 'org_inn must be at least 10 chars' });
    }
    if (!body.taxpayer_last_name) {
      return res.status(400).json({ error: 'taxpayer_last_name required' });
    }
    if (!body.taxpayer_first_name) {
      return res.status(400).json({ error: 'taxpayer_first_name required' });
    }
    if (!body.doc_type_code) {
      return res.status(400).json({ error: 'doc_type_code required' });
    }
    if (!body.doc_series_number) {
      return res.status(400).json({ error: 'doc_series_number required' });
    }

    // Apply org defaults (default signer, today's sign date) when the
    // certificate is linked to an organization and fields were not provided.
    let defaultSigner = null;
    if (body.org_id) {
      const r = await pool.query('SELECT signer_full_name FROM organizations WHERE id = $1', [body.org_id]);
      defaultSigner = r.rows[0]?.signer_full_name || null;
    } else if (body.org_inn) {
      const r = await pool.query('SELECT signer_full_name FROM organizations WHERE inn = $1', [body.org_inn]);
      defaultSigner = r.rows[0]?.signer_full_name || null;
    }
    if (defaultSigner || body.org_id || body.org_inn) {
      if (!body.signer_full_name && defaultSigner) body.signer_full_name = defaultSigner;
      if (!body.sign_date) body.sign_date = new Date().toLocaleDateString('en-CA');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Auto-assign the daily certificate number unless explicitly provided
      if (!body.certificate_number) {
        body.certificate_number = await generateCertificateNumber(client);
      }

      // Get all columns from the request body that match table columns
      const allowedCols = [
        'id', 'org_id', 'certificate_number', 'correction_number', 'report_year',
        'org_inn', 'org_kpp', 'org_name', 'is_full_time',
        'taxpayer_last_name', 'taxpayer_first_name', 'taxpayer_patronymic',
        'taxpayer_inn', 'taxpayer_birth_date', 'doc_type_code', 'doc_series_number',
        'doc_issue_date', 'is_same_person', 'expense_amount',
        'student_last_name', 'student_first_name', 'student_patronymic',
        'student_inn', 'student_birth_date', 'student_doc_type_code',
        'student_doc_series_number', 'student_doc_issue_date',
        'signer_full_name', 'sign_date', 'status', 'admin_notes'
      ];

      const cols = [];
      const vals = [];
      for (const col of allowedCols) {
        if (col in body) {
          cols.push(col);
          vals.push(body[col]);
        }
      }

      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const colList = cols.map((c) => `"${c}"`).join(', ');

      const result = await client.query(
        `INSERT INTO education_certificates (${colList}) VALUES (${placeholders}) RETURNING *`,
        vals
      );

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (txErr) {
      await client.query('ROLLBACK').catch(() => {});
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

// --- Complete an existing draft (taxpayer fills out the rest via shared link) ---
// Public access: the capability URL (the UUID) IS the auth, same as GET /:id.
// Only drafts can be completed; org identity, id, status and admin fields are locked.
router.post('/:id/complete', async (req, res, next) => {
  try {
    const body = req.body;

    const existing = await pool.query(
      'SELECT status, org_id FROM education_certificates WHERE id = $1',
      [req.params.id]
    );
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (existing.rows[0].status !== 'draft') {
      return res.status(409).json({ error: 'Certificate already submitted' });
    }

    // Drafts created before org defaults existed: fill them in on completion
    if (existing.rows[0].org_id) {
      const r = await pool.query(
        'SELECT signer_full_name FROM organizations WHERE id = $1',
        [existing.rows[0].org_id]
      );
      if (!body.signer_full_name && r.rows[0]?.signer_full_name) {
        body.signer_full_name = r.rows[0].signer_full_name;
      }
      if (!body.sign_date) body.sign_date = new Date().toLocaleDateString('en-CA');
    }

    // Map date fields: empty string -> null
    const dateFields = ['taxpayer_birth_date', 'doc_issue_date', 'student_birth_date', 'student_doc_issue_date', 'sign_date'];
    for (const f of dateFields) {
      if (body[f] === '') body[f] = null;
    }

    // Same required-field validation as the public create route
    if (!body.taxpayer_last_name) {
      return res.status(400).json({ error: 'taxpayer_last_name required' });
    }
    if (!body.taxpayer_first_name) {
      return res.status(400).json({ error: 'taxpayer_first_name required' });
    }
    if (!body.doc_type_code) {
      return res.status(400).json({ error: 'doc_type_code required' });
    }
    if (!body.doc_series_number) {
      return res.status(400).json({ error: 'doc_series_number required' });
    }

    // Taxpayer-editable columns only: no id, org_id, org_inn/org_kpp/org_name,
    // status, admin_notes, certificate_number, correction_number.
    const allowedCols = [
      'report_year', 'is_full_time',
      'taxpayer_last_name', 'taxpayer_first_name', 'taxpayer_patronymic',
      'taxpayer_inn', 'taxpayer_birth_date', 'doc_type_code', 'doc_series_number',
      'doc_issue_date', 'is_same_person', 'expense_amount',
      'student_last_name', 'student_first_name', 'student_patronymic',
      'student_inn', 'student_birth_date', 'student_doc_type_code',
      'student_doc_series_number', 'student_doc_issue_date',
      'signer_full_name', 'sign_date'
    ];

    const cols = [];
    const vals = [];
    for (const col of allowedCols) {
      if (col in body) {
        cols.push(col);
        vals.push(body[col]);
      }
    }

    if (cols.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setParts = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
    vals.push('now()'); // updated_at
    const updatedAtIdx = vals.length;

    const result = await pool.query(
      `UPDATE education_certificates SET ${setParts}, "updated_at" = $${updatedAtIdx} WHERE id = $${updatedAtIdx + 1} RETURNING *`,
      [...vals, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// --- Update a certificate by ID ---
// Auth required: org can only update certs belonging to their org, admin can update any.
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    // For org users: verify ownership before update
    if (req.auth.role === 'org') {
      const ownership = await pool.query(
        'SELECT org_id FROM education_certificates WHERE id = $1',
        [req.params.id]
      );
      if (!ownership.rows[0]) return res.status(404).json({ error: 'Not found' });
      if (ownership.rows[0].org_id !== req.auth.orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const allowedCols = [
      'certificate_number', 'correction_number', 'report_year',
      'org_inn', 'org_kpp', 'org_name', 'is_full_time',
      'taxpayer_last_name', 'taxpayer_first_name', 'taxpayer_patronymic',
      'taxpayer_inn', 'taxpayer_birth_date', 'doc_type_code', 'doc_series_number',
      'doc_issue_date', 'is_same_person', 'expense_amount',
      'student_last_name', 'student_first_name', 'student_patronymic',
      'student_inn', 'student_birth_date', 'student_doc_type_code',
      'student_doc_series_number', 'student_doc_issue_date',
      'signer_full_name', 'sign_date', 'status', 'admin_notes', 'org_id'
    ];

    const dateFields = ['student_birth_date', 'student_doc_issue_date', 'sign_date', 'taxpayer_birth_date', 'doc_issue_date'];

    const cols = [];
    const vals = [];
    for (const col of allowedCols) {
      if (col in req.body) {
        let val = req.body[col];
        if (dateFields.includes(col) && val === '') val = null;
        cols.push(col);
        vals.push(val);
      }
    }

    if (cols.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setParts = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
    vals.push('now()'); // updated_at
    const updatedAtIdx = vals.length;

    const result = await pool.query(
      `UPDATE education_certificates SET ${setParts}, "updated_at" = $${updatedAtIdx} WHERE id = $${updatedAtIdx + 1} RETURNING *`,
      [...vals, req.params.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// --- Duplicate a certificate ---
// Copies all data except: id (new UUID), created/updated timestamps,
// certificate_number (new daily ordinal), sign_date (today) and status (draft).
router.post('/:id/duplicate', requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const src = await client.query(
      'SELECT org_id FROM education_certificates WHERE id = $1',
      [req.params.id]
    );
    if (!src.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (req.auth.role === 'org' && src.rows[0].org_id !== req.auth.orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('BEGIN');
    const certificateNumber = await generateCertificateNumber(client);
    const result = await client.query(
      `INSERT INTO education_certificates (
         org_id, certificate_number, correction_number, report_year,
         org_inn, org_kpp, org_name, is_full_time,
         taxpayer_last_name, taxpayer_first_name, taxpayer_patronymic,
         taxpayer_inn, taxpayer_birth_date, doc_type_code, doc_series_number,
         doc_issue_date, is_same_person, expense_amount,
         student_last_name, student_first_name, student_patronymic,
         student_inn, student_birth_date, student_doc_type_code,
         student_doc_series_number, student_doc_issue_date,
         signer_full_name, sign_date, status, admin_notes
       )
       SELECT
         org_id, $2, correction_number, report_year,
         org_inn, org_kpp, org_name, is_full_time,
         taxpayer_last_name, taxpayer_first_name, taxpayer_patronymic,
         taxpayer_inn, taxpayer_birth_date, doc_type_code, doc_series_number,
         doc_issue_date, is_same_person, expense_amount,
         student_last_name, student_first_name, student_patronymic,
         student_inn, student_birth_date, student_doc_type_code,
         student_doc_series_number, student_doc_issue_date,
         signer_full_name, CURRENT_DATE, 'draft', admin_notes
       FROM education_certificates WHERE id = $1
       RETURNING *`,
      [req.params.id, certificateNumber]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// --- Delete a certificate by ID ---
// Auth required: org can only delete certs belonging to their org, admin can delete any.
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    // For org users: verify ownership before delete
    if (req.auth.role === 'org') {
      const ownership = await pool.query(
        'SELECT org_id FROM education_certificates WHERE id = $1',
        [req.params.id]
      );
      if (!ownership.rows[0]) return res.status(404).json({ error: 'Not found' });
      if (ownership.rows[0].org_id !== req.auth.orgId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const result = await pool.query(
      'DELETE FROM education_certificates WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ id: result.rows[0].id });
  } catch (err) { next(err); }
});

export default router;
