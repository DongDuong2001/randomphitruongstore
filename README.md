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
- Vietnam checkout with 50% deposit or VNPay/MoMo placeholder boundaries
- Korea, Taiwan and Japan consultation handoff through Zalo
- Inspiration image upload and database-backed order requests
- Signed temporary admin session, product CRUD and order/request management
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

   Replace `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` with strong values.

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
| `ADMIN_PASSWORD` | Temporary admin login password |
| `ADMIN_SESSION_SECRET` | Secret used to sign the HTTP-only admin session |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and sitemap |
| `UPLOAD_DRIVER` | Upload implementation; currently supports `local` |

## Payment integration boundary

`/api/payment/vnpay-placeholder` and `/api/payment/momo-placeholder` do not
collect money. They intentionally represent the point where signed gateway
requests, return URLs and verified webhooks should be integrated. Orders are
created as `PENDING_ONLINE_PAYMENT` before redirecting.

## Upload storage

The local driver writes validated JPG, PNG and WebP files (maximum 5 MB) to
`public/uploads`. Local disk is suitable for development and a single persistent
server. For serverless deployment, implement the `UploadStorage` interface in
`src/lib/upload.ts` with Cloudflare R2 or Supabase Storage.

## Admin authentication

The MVP compares `ADMIN_PASSWORD` using a timing-safe check, then stores an
HMAC-signed HTTP-only cookie. Replace `src/lib/admin-auth.ts` with a real identity
provider before adding multiple admins, roles, password recovery or audit logs.

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
