# KND 1151158 -- Online Tax Deduction Certificate Service

A web service for Russian educational organizations to generate, manage, and print tax deduction certificates (form KND 1151158) required for social tax deductions under Article 219 of the Russian Tax Code.

## What It Does

Students (or their parents) paying for education need a certificate from their school/university to claim a tax deduction. Traditionally, this involves paperwork, queues, and manual data entry. This service digitizes the entire process:

1. **Organization registers** on the platform with their INN, KPP, and a PIN code.
2. **Organization shares a link** (e.g., `yoursite.com/2721980448`) with students/payers.
3. **Payer opens the link**, sees the organization fields pre-filled, and fills in their personal data.
4. **Organization reviews** submitted certificates in their dashboard, edits if needed, and prints the official two-page form -- complete with optional QR code, stamp, and facsimile overlays.

No accounts for payers. No passwords. No app to install. Just a link and a form.

## Key Design Decisions

**PIN-based org auth, not email/password.** Educational institutions share a single organizational login. A 6-digit PIN is simpler for secretaries and accountants who rotate frequently. The super admin can reset PINs from the admin panel.

**Slug = INN by default.** Every organization gets a public URL based on their 10-digit INN (e.g., `/2721059445`). Premium clients can get a custom human-readable slug (e.g., `/tekhnikum`), changeable only by the super admin. This keeps URLs functional for everyone while offering a branding perk for paying clients.

**No user accounts for payers.** A payer opens a link, fills out a form, submits it. That is the entire interaction. Each submission gets a unique UUID-based URL that serves as a receipt and status page.

**Print-first output.** The certificate must match the official KND 1151158 layout precisely. The print view renders a pixel-accurate two-page document at 210x297mm with proper cell-based fields, overlay positioning for stamps/signatures, and clean print margins.

## Architecture

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Supabase (Postgres + Row Level Security + Storage + Edge Functions)
- **INN Lookup:** Supabase Edge Function proxying DaData API for organization data resolution
- **Hosting:** Static SPA -- deploy anywhere (Nginx, Caddy, Netlify, Vercel, etc.)

### Project Structure

```
src/
  components/
    admin/       Super admin interface (certificate list, org list, certificate editor)
    form/        Public certificate form (PDF-like layout, cell inputs, zoom controls)
    org/         Organization portal shell (auth guard, layout/navigation)
    print/       Print-ready certificate renderer (two pages, overlay support)
    ui/          Shared UI primitives (inputs, selects, section headers)
  contexts/      React context (organization session management)
  hooks/         Custom hooks (INN lookup via edge function)
  lib/           Supabase client, Cyrillic utilities
  pages/         Route-level page components
  types/         TypeScript interfaces (Certificate, Organization)

supabase/
  functions/     Edge functions (inn-lookup)
  migrations/    Database schema migrations (10 files)
```

### Routes

| Path | Description |
|------|-------------|
| `/` | Empty certificate form |
| `/:slug` | Pre-filled form for an organization (slug = INN or custom name) |
| `/:slug/:formId` | Specific form submission |
| `/s/:formId` | Short link to a specific submission (no org context) |
| `/print/:id` | Public print view for a certificate |
| `/org/login` | Organization login (PIN-based) |
| `/org/register` | New organization registration |
| `/org/dashboard` | Organization certificate management |
| `/org/certificates/:id` | Edit a specific certificate |
| `/org/print/:id` | Print with QR/stamp/facsimile overlays |
| `/org/settings` | Organization settings (name, signer, assets) |
| `/admin` | Super admin panel |

### Database Tables

- **`education_certificates`** -- All submitted certificates with full form data, status tracking, and org association.
- **`organizations`** -- Registered organizations with INN, KPP, slug, PIN, signer info, and uploaded asset URLs.

## Local Development

```bash
cp .env.example .env   # Add your Supabase URL and anon key
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |

## Deployment

This is a static single-page application. Build it and serve the `dist/` folder with any web server. All routing is client-side, so configure your server to serve `index.html` for all paths.

```bash
npm run build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a detailed Ubuntu VPS self-hosting guide with Nginx and SSL.

## License

Private. All rights reserved.
