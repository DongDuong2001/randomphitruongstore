# random.phitruong store

Production-oriented MVP order store for the Vietnamese streetwear brand
`random.phitruong`.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS
- PostgreSQL and Prisma
- next-intl (Vietnamese and English)
- React Hook Form and Zod
- lucide-react and Next/Image

## Features

- Localized storefront, catalog filters, product details and social links
- Vietnam checkout with 50% deposit, SePay Payment Gateway, or VNPay/MoMo placeholder boundaries
- Korea, Taiwan and Japan consultation handoff through Zalo
- Inspiration image upload and database-backed order requests
- Individual admin accounts, revocable admin sessions, product CRUD and order/request management
- Dynamic product metadata, sitemap and robots rules

## Local setup

Requirements: Node.js 20.9 or newer, npm, and PostgreSQL. Docker is optional.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start PostgreSQL (optional Docker setup):

   ```bash
   docker compose up -d
   ```

3. Create the environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, and
   `ADMIN_BOOTSTRAP_NAME` before seeding the first admin account.

4. Generate Prisma Client and create the database:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Seed the product catalog:

   ```bash
   npm run prisma:seed
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`. Admin sign-in is at
`http://localhost:3000/admin/login`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `ADMIN_BOOTSTRAP_EMAIL` | Optional email used by `npm run prisma:seed` to create the first admin |
| `ADMIN_BOOTSTRAP_PASSWORD` | Optional one-time seed password for the first admin account |
| `ADMIN_BOOTSTRAP_NAME` | Optional display name for the first admin account |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and sitemap |
| `UPLOAD_DRIVER` | Upload implementation; currently supports `local` |
| `SEPAY_ENVIRONMENT` | `sandbox` for the signed local simulator or `production` for SePay |
| `SEPAY_MERCHANT_ID` | SePay Payment Gateway merchant ID |
| `SEPAY_MERCHANT_SECRET_KEY` | SePay merchant secret used to sign checkout forms |
| `SEPAY_IPN_SECRET_KEY` | Secret configured for SePay's `X-Secret-Key` IPN authentication |
| `SEPAY_SANDBOX_SECRET` | Optional dedicated secret for local simulator completion proofs |

## Payment integration

SePay uses its official Node SDK to generate a signed form POST. Configure the
public HTTPS IPN URL as `/api/payment/sepay/webhook` with authentication type
`SECRET_KEY`, and set the same value in `SEPAY_IPN_SECRET_KEY`. The server
validates nested IPN data, currency, amount, invoice, and transaction IDs before
an atomic payment transition.

In local `sandbox` mode, the signed simulator uses the same atomic settlement
path without collecting money. VNPay and MoMo remain explicit placeholders.

## Upload storage

The local driver writes validated JPG, PNG and WebP files (maximum 5 MB) to
`public/uploads`. Local disk is suitable for development and a single persistent
server. For serverless deployment, implement the `UploadStorage` interface in
`src/lib/upload.ts` with Cloudflare R2 or Supabase Storage.

## Admin authentication

Admin sign-in uses individual `AdminUser` records with scrypt password hashes.
Successful login creates a random HTTP-only session token and stores only its
hash in `AdminSession`, where it can expire or be revoked. To bootstrap the
first account, set `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD`, run
`npm run prisma:seed`, then remove those bootstrap values from the deployment
environment.

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run db:studio
```

## Contributing

Before starting an issue, read [CONTRIBUTING.md](./CONTRIBUTING.md) for branch
naming, Conventional Commits, Pull Request requirements, protected ownership,
and the required lint/build/secret-scan checklist.
