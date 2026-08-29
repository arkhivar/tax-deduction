# Tax-deduction (КНД 1151158) — Project Roadmap & Context

This file is a living note for the next maintainer (or future self). It captures technical-debt items that are intentionally deferred and the concrete steps needed when we are ready to address them.

## Tech stack (current)

- Frontend: React 18 + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + PostgreSQL 16
- Deployment: static `dist/` served by nginx at `62.181.44.176:80/443` (reverse proxy to app at `:8080`)
- Source: `/root/tax-deduction/`

## Technical debt / roadmap items

### 1. Split `signer_full_name` into three DB columns

**Status:** Deferred. Currently implemented as a frontend-only parse/join over the single `signer_full_name` string.

**Why we deferred it:** The org admin edit page (`/org/certificates/:id`) and the print form now show three separate fields (Фамилия / Имя / Отчество), but the backend still stores one string. A frontend-only split is sufficient for the current UI and avoids a migration.

**Why we should do it eventually:**
- Preserves name-part positions unambiguously (no edge cases with empty middle names, compound surnames, or double spaces).
- Aligns with the existing `taxpayer_last_name`, `taxpayer_first_name`, `taxpayer_patronymic` columns.
- Allows validation and search per name part.
- Makes the global admin `CertificateEdit.tsx` and org settings `OrgSettingsPage.tsx` consistent without string parsing tricks.

**Migration plan when ready:**

1. **Database**
   ```sql
   ALTER TABLE certificates
     ADD COLUMN signer_last_name VARCHAR(255),
     ADD COLUMN signer_first_name VARCHAR(255),
     ADD COLUMN signer_patronymic VARCHAR(255);
   ```

2. **Backfill data** (one-time, idempotent)
   ```sql
   UPDATE certificates
   SET signer_last_name = split_part(signer_full_name, ' ', 1),
       signer_first_name = split_part(signer_full_name, ' ', 2),
       signer_patronymic = split_part(signer_full_name, ' ', 3)
   WHERE signer_full_name IS NOT NULL AND signer_full_name <> '';
   ```
   (PostgreSQL's `split_part` treats consecutive spaces as a single separator and returns `''` for missing parts.)

3. **Backend API**
   - Update the `Certificate` type / validation to accept and return `signer_last_name`, `signer_first_name`, `signer_patronymic`.
   - Keep `signer_full_name` in the response for backward compatibility, or remove it after the frontend is updated.
   - Update `GET /api/certificates/:id`, `PUT /api/certificates/:id`, and any create endpoint.

4. **Frontend**
   - Update `Certificate` interface in `src/types/certificate.ts`.
   - Replace the parse/join logic in `OrgCertificateEditPage.tsx` with direct field updates.
   - Replace the parse logic in `PrintPage.tsx` with direct `padChars(cert.signer_last_name, 20)` etc.
   - Update `CertificateEdit.tsx` (global admin) and `OrgSettingsPage.tsx` (default signer) to use the three columns instead of the single string.

### 2. Replace native `<input type="date">` with a controlled Russian date picker

**Status:** ✅ Done. Created `src/components/ui/DateInput.tsx` — a masked text input that displays and accepts `dd.mm.yyyy`, stores/emits ISO `yyyy-mm-dd`. All date inputs across `OrgCertificateEditPage.tsx`, `CertificateEdit.tsx`, and `CertificateForm.tsx` now use `<DateInput>` instead of `<input type="date">`.

**Original problem:** Native date inputs render based on the browser/OS locale, not the page's `lang` attribute. Setting `<html lang="ru">` was not enough to force `dd.mm.yyyy`.

### 3. Centralize date formatting utility

**Status:** Each page/component has its own `formatDate` helper.

**Why we should do it eventually:** Avoids drift and makes it easy to switch the entire app to a custom format if needed. A single `formatDate(date, { withTime?: boolean })` helper in `src/lib/dates.ts` would cover all display cases.

## Files that changed for deferred item #1 (frontend-only)

- `src/components/ui/SignerNameInput.tsx` — centralized 3-box input that parses/joins `signer_full_name`.
- `src/components/print/PrintPage.tsx` — three signer cell rows, parse logic.

### 4. Re-enable HTML caching when active development ends

**Status:** Deferred (currently disabled during active development).

**What was changed:** Both nginx configs (`/etc/nginx/conf.d/knd.conf` for mesh IP `:8080`, and `/etc/nginx/conf.d/vychet-public.conf` for public domain `вычет.help`) now send `Cache-Control: no-cache, no-store, must-revalidate` on the `location /` block so the browser always re-fetches `index.html`. This means a normal reload picks up new JS bundles after every `npm run build` — no manual cache clearing needed.

**When to revert:** Once active development slows down and deploys become infrequent, re-enable HTML caching for performance:

1. In both nginx config files, remove these two lines from the `location /` block:
   ```
   add_header Cache-Control "no-cache, no-store, must-revalidate";
   expires 0;
   ```
2. Reload nginx: `systemctl reload nginx`

**Backups:** The pre-change configs are at `/etc/nginx/conf.d/knd.conf.bak.*` and `/etc/nginx/conf.d/vychet-public.conf.bak.*`.

**Note:** The `/assets/` location block should keep its `Cache-Control: public, immutable` header — hashed bundle filenames make aggressive caching safe there.

## Notes

- Keep this file in the repo root so it is easy to find.
- Update it when a deferred item is finally implemented.
