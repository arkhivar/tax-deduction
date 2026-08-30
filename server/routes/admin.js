import os from 'os';
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

// Process start time for the API uptime figure
const startedAt = Date.now();

/**
 * GET /api/admin/overview
 * Sysadmin home screen: auth activity + basic system stats.
 */
router.get('/overview', requireAdminAuth, async (_req, res, next) => {
  try {
    const [counts, recent, active] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE success AND created_at > now() - interval '24 hours') AS logins_24h,
          COUNT(*) FILTER (WHERE NOT success AND created_at > now() - interval '24 hours') AS failed_24h,
          COUNT(*) FILTER (WHERE NOT success AND created_at > now() - interval '7 days') AS failed_7d
        FROM login_events
      `),
      pool.query(`
        SELECT e.created_at, e.role, e.inn, e.success, e.ip, o.name AS org_name
        FROM login_events e
        LEFT JOIN organizations o ON o.id = e.org_id
        ORDER BY e.created_at DESC
        LIMIT 15
      `),
      pool.query(`
        SELECT id, name, inn, last_login_at
        FROM organizations
        WHERE last_login_at > now() - interval '7 days'
        ORDER BY last_login_at DESC
      `),
    ]);

    res.json({
      logins24h: parseInt(counts.rows[0].logins_24h),
      failed24h: parseInt(counts.rows[0].failed_24h),
      failed7d: parseInt(counts.rows[0].failed_7d),
      recentEvents: recent.rows,
      activeOrgs: active.rows,
      system: {
        apiUptimeSec: Math.floor((Date.now() - startedAt) / 1000),
        hostUptimeSec: Math.floor(os.uptime()),
        loadavg: os.loadavg().map((v) => Math.round(v * 100) / 100),
        cpus: os.cpus().length,
        memTotalMb: Math.round(os.totalmem() / 1048576),
        memFreeMb: Math.round(os.freemem() / 1048576),
        node: process.version,
      },
    });
  } catch (err) { next(err); }
});

export default router;
