# Apex Fence Cloudflare setup

This repo now contains the Cloudflare Pages Functions needed for online estimate intake, customer photo storage, and CRM sync.

## Cloudflare resources

Create:
- Pages project connected to this GitHub repo
- D1 database: `apex-fence-crm`
- R2 bucket: `apex-fence-photos`

Bind them to the Pages project with these exact variable names:
- D1: `DB`
- R2: `PHOTOS`

Add a Production secret:
- `APEX_CRM_TOKEN` = a long random password/token you create

Also add the same bindings/secrets to Preview if you want preview deployments to work.

## Initialize D1

Run the SQL in `migrations/0001_online_leads.sql` once in the D1 Console, or with Wrangler.

After bindings are added, redeploy the Pages project. Cloudflare Pages Functions in `/functions` are then deployed automatically with the site.

## What is now wired

Customer form:
- Existing Apex estimate form is retained.
- Up to 5 photos.
- JPEG, PNG, WebP, HEIC and HEIF.
- 8 MB maximum per photo.
- 25 MB total photo limit.
- Lead + photo metadata go to D1.
- Actual photos go to private R2.

CRM:
- Settings contains the Cloudflare CRM token field.
- Sync Online Leads pulls new online leads into the existing local CRM.
- Customer photos are displayed from the private R2 endpoint.
