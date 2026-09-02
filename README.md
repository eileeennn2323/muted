# Muted

A private AI-powered relationship intelligence assistant for people at work.
See `masterplan.md` for the full product spec.

## Stack

Next.js (App Router) + Tailwind v4 + Supabase (Postgres) + Gemini API, deployed on Vercel.

## Setup

1. **Install dependencies**

   ```
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Run the schema migrations.** Open the Supabase SQL Editor and run each file in
   `supabase/migrations/` in order (`0001_init.sql` through the highest-numbered file
   present) — there's no migration runner, so each one has to be pasted in and run
   individually, oldest first.

4. **Configure environment variables.** Copy `.env.example` to `.env.local` and fill in:

   - `SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` key
     (**not** the `anon` key — this key is only ever used server-side)
   - `GEMINI_API_KEY` — free-tier key from [Google AI Studio](https://aistudio.google.com/apikey), required for Capture and Ask Muted

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

## Other scripts

- `npm run reset-workspace -- <workspace-id>` — deletes a single judge workspace
  (find its id from the `muted_session` cookie value) so the next visit re-clones
  a fresh copy of the current demo dataset.
- `npm run dedupe-lessons` — one-off cleanup that merges lesson rows sharing an
  exact title within a workspace.
