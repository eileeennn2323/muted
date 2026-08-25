/**
 * Resets a single judge/rehearsal workspace back to a fresh clone of the
 * demo dataset — for rehearsing the live demo repeatedly without notes,
 * insights, or Ask Muted history piling up from previous run-throughs.
 *
 * Deleting the workspace row cascades away everything under it (people,
 * notes, insights, lessons, conversations, usage counters). The app's
 * existing ensureWorkspaceSeeded() lazily re-clones fresh demo data into it
 * the next time that session cookie is used, so nothing else needs to run —
 * just reload the page after this finishes.
 *
 * Usage: npm run reset-workspace -- <workspace-id>
 * Find your workspace id from the `muted_session` cookie value (open
 * DevTools on localhost:3000 → Application/Storage → Cookies).
 */
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local present — fall through to process.env as-is
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

if (!url || !key) {
  console.error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role, not anon) before running this script."
  );
  process.exit(1);
}

const workspaceId = process.argv[2];
if (!workspaceId) {
  console.error("Usage: npm run reset-workspace -- <workspace-id>");
  process.exit(1);
}
if (workspaceId === DEMO_WORKSPACE_ID) {
  console.error("Refusing to delete the shared demo workspace itself — run `npm run seed` for that.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId)
    .select("id")
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    console.log(`No workspace found with id ${workspaceId} — nothing to reset.`);
    return;
  }
  console.log(`Reset workspace ${workspaceId}. Reload the page to get a fresh clone of the demo data.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
