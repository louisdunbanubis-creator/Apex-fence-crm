# Apex Fence CRM

A mobile-first CRM and public website for Apex Fence.

## What is in this repository

- Public Apex Fence website (`index.html`)
- Apex Hub CRM (`crm.html`)
- Local-first CRM data storage with JSON backup/restore
- Estimate builder and customer quote printing
- Cloudflare Pages Functions under `/functions`
- D1 online lead database schema under `/migrations`
- Private R2 customer photo storage
- Authenticated online-lead sync and photo viewing
- PWA manifest, install support, and service worker
- Security headers middleware
- Cloudflare deployment/setup documentation

## Cloudflare production architecture

Customer → Apex website → Pages Function `/api/lead` → D1 + private R2 → Apex Hub CRM → authenticated photo viewer.

Required production resources:
- Cloudflare Pages project connected to this GitHub repository
- D1 database named `apex-fence-crm`
- R2 bucket named `apex-fence-photos`
- D1 binding: `DB`
- R2 binding: `PHOTOS`
- Encrypted secret: `APEX_CRM_TOKEN`

## Deployment

This repository is designed for Cloudflare Pages Git integration. Pushes to `main` should deploy the connected Pages project automatically.

The old GitHub Pages deployment workflow has been replaced with a repository validation workflow.

## First-time Cloudflare setup

Follow `CLOUDFLARE-SETUP.md`. The repo contains the application code, migration, local-development templates, validation workflow, and required binding names. Account-specific IDs and secrets are intentionally not committed.

After the Pages project/resources exist, Cloudflare recommends downloading the real active Pages configuration with `npx wrangler pages download config` rather than guessing database IDs.

## Online estimate form

The public form posts to `/api/lead`.

Photos:
- Maximum 5
- JPEG, PNG, WebP, HEIC, HEIF
- Maximum 8 MB each
- Maximum 25 MB total

Lead records go to D1. Photo files go to private R2. CRM reads leads through an authenticated bearer token; photos are not public.

## Local development

1. Copy `.dev.vars.example` to `.dev.vars` only for local testing.
2. Never commit `.dev.vars`.
3. Use `npx wrangler@latest`.
4. After Cloudflare resources exist, use the downloaded Wrangler configuration for local bindings.
5. Run `npx wrangler pages dev .`.

## Backup

The CRM remains local-first. Use Settings → Export Backup regularly, especially before changing devices.