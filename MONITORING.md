# Monitoring

Two layers cover this service: **Zabbix** for infrastructure, and a **built-in app-level overview** for everything Zabbix can't see (auth activity, per-org behavior).

## 1. Infrastructure — Zabbix

- The VPS runs `zabbix-agent2.service` (Zabbix Agent 2, port 10050, mesh interface), reporting host metrics (CPU, RAM, disk, network, uptime) to the central Zabbix server.
- Agent provisioning and Zabbix server details: https://github.com/arkhivar/puppet/blob/main/_ZABBIX.md
- **Zabbix is authoritative** for metric history, graphs, and alerting. Suggested checks to configure there if not present:
  - `knd-server.service` systemd unit state (API on `127.0.0.1:3001`)
  - HTTPS availability of `https://вычет.help` and `GET /api/health` behind it
  - Disk space (PostgreSQL data + uploads)

## 2. Application — built-in overview (`/admin`)

The admin home screen (`/admin`, "Обзор") is backed by `GET /api/admin/overview` (admin-only) and shows:

- **Auth audit** — every org (INN+PIN) and admin login is written to the `login_events` table with success/failure, IP (from `X-Forwarded-For`), and timestamp. The page shows logins per 24h, failed attempts (24h / 7d), and the last 15 events.
- **Active organizations** — orgs with a successful login in the last 7 days (`organizations.last_login_at`).
- **Quick system glance** — host and API-process uptime, load average + CPU count, RAM used/total. This duplicates what Zabbix collects; use Zabbix for trends and alerts, this page for a quick look while administering.

Logging is fire-and-forget: a failure to write an audit row never breaks a login.

## 3. Logs

- API server: `journalctl -u knd-server -f`
- nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- Health check endpoint: `GET /api/health` → `{ "status": "ok" }`

## What to watch

- Spikes in failed login attempts (`login_events` where `success = false`) — possible PIN brute-forcing. The auth endpoints are rate-limited (20 req / 15 min), but repeated offenders in the audit log deserve a look.
- `knd-server` restarts (uptime chip on `/admin` resets) — check `journalctl` for crashes.
- Premium CTA interest: `organizations.premium_requested_at` (visible in `/admin/orgs`).
