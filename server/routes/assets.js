import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

const router = Router();

// --- Configure multer for file uploads ---
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const orgDir = path.join(uploadsDir, req.params.orgId);
    fs.mkdirSync(orgDir, { recursive: true });
    cb(null, orgDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, file.fieldname + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File must be an image'));
    }
  },
});

// POST /api/assets/:orgId/:field
// field = qr | stamp | facsimile
// Auth required: org can only upload to their own org directory.
router.post('/:orgId/:field', requireAuth, (req, res, next) => {
  // Validate orgId format (must be a UUID, not a path traversal)
  const orgId = req.params.orgId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) {
    return res.status(400).json({ error: 'Invalid org ID format' });
  }

  // Org users can only upload to their own org directory; admins can upload to any org
  if (req.auth.role === 'org' && req.auth.orgId !== orgId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.auth.role !== 'org' && req.auth.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const validFields = ['qr', 'stamp', 'facsimile'];
  if (!validFields.includes(req.params.field)) {
    return res.status(400).json({ error: 'Invalid field name' });
  }

  upload.single(req.params.field)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const publicUrl = `/uploads/${req.params.orgId}/${req.file.filename}`;
    res.json({ url: publicUrl });
  });
});

export default router;
