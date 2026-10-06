# Apex Fence CRM

A mobile-first CRM for Apex Fence.

## Current architecture

- Public Apex Fence website
- Apex Hub CRM
- Existing local CRM storage remains intact
- Cloudflare Pages + Pages Functions for server-side work
- Cloudflare D1 for online lead records
- Cloudflare R2 for private customer fence photos
- Online lead sync into the existing CRM
- Customer photo viewer inside the CRM
- Installable PWA

## Local CRM

The CRM continues to keep a browser-local copy so existing data and the current workflow are not lost.

## Cloudflare setup

See [CLOUDFLARE-SETUP.md](CLOUDFLARE-SETUP.md).

Required Cloudflare bindings:

- D1 binding: `DB`
- R2 binding: `PHOTOS`
- Secret: `APEX_CRM_TOKEN`

The SQL schema is in `migrations/0001_online_leads.sql`.

## Online estimate form

The existing Apex estimate form now submits to the Cloudflare Pages Function at `/api/lead`.

Customers can upload up to 5 fence photos:
- JPEG
- PNG
- WebP
- HEIC
- HEIF

Limits:
- 8 MB per photo
- 25 MB total

Photos are stored privately in R2 and are only served through the authenticated CRM photo endpoint.
