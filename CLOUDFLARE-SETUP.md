# Apex Fence — Cloudflare Production Setup

This repository contains the application code needed for the Apex Fence website + CRM. The only things that must remain outside Git are account-specific Cloudflare resources/IDs and encrypted secrets.

## 1. Create/connect the Pages project

- GitHub repo: `louisdunbanubis-creator/Apex-fence-crm`
- Production branch: `main`
- Build command: `exit 0`
- Build output directory: `.`

Use Cloudflare Pages Git integration so pushes to `main` deploy automatically.

## 2. Create Cloudflare resources

Create:
- D1 database: `apex-fence-crm`
- R2 bucket: `apex-fence-photos`

Bind them to the Pages project with these exact variable names:
| Resource | Variable name |
|---|---|
| D1 | `DB` |
| R2 | `PHOTOS` |

## 3. Create the CRM secret

Create an encrypted Production secret:
- Name: `APEX_CRM_TOKEN`
- Value: a long random secret that you control.

Do not put the value in GitHub. If Preview deployments are enabled, configure the Preview secret separately.

## 4. Initialize D1

Run `migrations/0001_online_leads.sql` once against the production D1 database.

Do not repeatedly replace the migration. Future schema changes should use new numbered migration files.

## 5. Verify the deployment

Expected routes:
- `/` — public Apex Fence website
- `/crm.html` — Apex Hub CRM
- `/api/lead` — public estimate intake
- `/api/leads` — authenticated CRM lead sync
- `/api/photo?key=...` — authenticated photo retrieval

The `/functions` directory is intentionally at the repository root for Pages Functions.

## 6. Configure the CRM

Open `/crm.html` → Settings → Online estimates & customer photos.

Paste the same value used for the Cloudflare `APEX_CRM_TOKEN` secret and save settings.

If a token is saved, the CRM automatically attempts an online sync when it loads. The manual Sync Online Leads button remains available.

## 7. Verify end-to-end

1. Open the public website.
2. Submit a test estimate without photos.
3. Submit another test estimate with 1–2 photos.
4. Confirm the leads appear in D1.
5. Confirm the photos appear in the R2 bucket.
6. Open CRM → Settings and sync.
7. Confirm the online leads appear in Leads.
8. Open the synced lead and confirm Photos loads.
9. Confirm an unauthenticated request to `/api/leads` returns 401.
10. Confirm an unauthenticated request to `/api/photo?...` returns 401.

Use Cloudflare Pages Functions logs if a production function fails.

## 8. Get the real Wrangler configuration

Once the Cloudflare project and resources exist, use:

`npx wrangler pages download config`

Cloudflare recommends downloading the active project configuration instead of manually inventing D1 IDs or binding IDs.

## Local development

- `.dev.vars.example` is safe to commit as a template.
- `.dev.vars` is ignored and must never be committed.
- `wrangler.jsonc.example` documents the expected Pages configuration shape without exposing account IDs.

The repo intentionally does not contain real Cloudflare secrets or guessed account/database IDs.