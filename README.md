# Muted

A private AI relationship assistant that turns your observations and thoughts about people into practical guidance for navigating relationship dynamics at work.
See `masterplan.md` for the full product spec.

## Stack

Next.js (App Router) + Tailwind v4 + Supabase (Postgres) + Gemini API, deployed on Vercel.

## Setup

1. **Install dependencies**

   ```
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Run the schema migration.** Open the Supabase SQL Editor and run the contents of
   `supabase/migrations/0001_init.sql`.

4. **Configure environment variables.** Copy `.env.example` to `.env.local` and fill in:

   - `SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` key
     (**not** the `anon` key — this key is only ever used server-side)
   - `GEMINI_API_KEY` — free-tier key from [Google AI Studio](https://aistudio.google.com/apikey), not needed until Day 2

5. **Seed the demo workspace**

   ```
   npm run seed
   ```

   Re-run this any time to reset the shared fictional demo dataset back to its
   starting state.

6. **Run the dev server**

   ```
   npm run dev
   ```

   Visit `http://localhost:3000`. You'll land on the mock unlock screen first
   (PIN on desktop widths, face-scan simulation on mobile widths) — neither is
   real authentication.

## How workspaces work

There's one shared `demo` workspace (the fictional dataset from `scripts/seed.ts`).
On first visit, the server issues an httpOnly session cookie identifying a private
judge workspace, and lazily clones the entire demo dataset into it the first time
it's needed. Anything captured afterwards writes only to that workspace — it never
touches the shared demo data or another visitor's workspace.
