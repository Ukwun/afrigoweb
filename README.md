# Afrigo — Digital Trade Operating System (Prototype)

This workspace contains a minimal Next.js App Router scaffold for the Afrigo project.

What I scaffolded:

- Next.js app router skeleton (`src/app`)
- Tailwind + Framer Motion for interactive micro animations
- Clerk authentication integration scaffolding
- Supabase Postgres schema and onboarding API support
- Real-time dashboard updates via Server-Sent Events
- Role selection and onboarding workflow UI

Next steps I propose:

1. Configure Clerk and Supabase keys in `.env.local`.
2. Run the database migration from `db/migrations/001_init.sql`.
3. Sign in at `/login`, complete onboarding at `/onboarding`, and view the dashboard at `/dashboard`.
4. Replace mocked KYC upload with real S3/Supabase storage and add milestone workflow state.

To run locally:

```bash
cd c:/afrigoweb
npm install
npm run dev
```

Environment variables: copy `.env.example` to `.env.local` and fill in keys.
