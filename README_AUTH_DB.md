Auth & DB integration notes

Environment variables to set locally (.env.local):

NEXT_PUBLIC_SUPABASE_URL=<your supabase url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key - keep secret>
CLERK_PUBLISHABLE_KEY=<clerk publishable>
CLERK_SECRET_KEY=<clerk secret>

Suggested steps to enable auth + DB:

1. Create Supabase project and Postgres DB.
2. Run the migration: psql "postgres://user:pass@host/db" -f db/migrations/001_init.sql
3. Create a Clerk account and add frontend app redirect URIs.
4. Add Clerk middleware to Next.js and wrap the app with ClerkProvider.
5. Use `supabaseAdmin` on the server to upsert users and organizations.

Security:
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` out of client bundles.
