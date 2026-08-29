import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 *
 * Two token types:
 *   - org token:  { role: 'org',  orgId: '<uuid>' }   → scoped to one org
 *   - admin token: { role: 'admin' }                  → full access
 *
 * Public routes (form submission, form status check) don't go through this.
 */

// Lazy secret evaluation — process.env.JWT_SECRET is loaded from .env by index.js
// AFTER this module is imported, so we read it at call time, not import time.
function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  // Fallback: derive a stable secret from DB password + a fixed pepper.
  const pepper = 'knd-1151158-jwt-pepper-v1';
  return `${process.env.DB_PASSWORD || 'fallback'}-${pepper}`;
}

const TOKEN_TTL = '7d';

/**
 * Sign a JWT for an organization session.
 */
export function signOrgToken(orgId) {
  return jwt.sign({ role: 'org', orgId }, getJwtSecret(), { expiresIn: TOKEN_TTL });
}

/**
 * Sign a JWT for an admin session.
 */
export function signAdminToken() {
  return jwt.sign({ role: 'admin' }, getJwtSecret(), { expiresIn: TOKEN_TTL });
}

/**
 * Verify the Authorization header and attach the decoded payload to req.auth.
 *
 * Usage:
 *   requireAuth             — any authenticated user (org or admin)
 *   requireOrgAuth          — org-scoped auth only (sets req.auth.orgId)
 *   requireAdminAuth        — admin-only auth
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.auth = decoded; // { role, orgId? }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require org-level authentication.
 * Attaches req.auth.orgId for scoping DB queries.
 */
export function requireOrgAuth(req, res, next) {
  requireAuth(req, res, () => {
    if (req.auth.role !== 'org' || !req.auth.orgId) {
      return res.status(403).json({ error: 'Organization access required' });
    }
    next();
  });
}

/**
 * Require admin authentication.
 */
export function requireAdminAuth(req, res, next) {
  requireAuth(req, res, () => {
    if (req.auth.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/**
 * Helper: strip pin_code from an org record before sending to client.
 * Only admins should ever see pin_code in API responses.
 */
export function sanitizeOrg(org, includePin = false) {
  if (!org) return org;
  const { pin_code, ...rest } = org;
  return includePin ? { ...rest, pin_code } : rest;
}
