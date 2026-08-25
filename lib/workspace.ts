import "server-only";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { cloneDemoDataInto } from "@/lib/seed/cloneWorkspace";

export const SESSION_COOKIE = "muted_session";

/** Fixed id of the shared, judge-facing fictional demo workspace. Seeded by scripts/seed.ts. */
export const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Reads the workspace id for the current request. This is always set by
 * middleware before a request reaches a route or Server Component, so it
 * should only be undefined in edge cases (e.g. this helper called outside a
 * request context). Callers should treat undefined as "no data yet" rather
 * than throwing.
 */
export async function getWorkspaceId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/**
 * Ensures a judge workspace exists and has been seeded with a private copy
 * of the demo dataset. Safe to call on every request — after the first call
 * it's a single indexed lookup. Never touches the demo workspace itself.
 */
export async function ensureWorkspaceSeeded(workspaceId: string): Promise<void> {
  if (workspaceId === DEMO_WORKSPACE_ID) return;

  const supabase = getSupabaseAdmin();

  const { data: existing, error: selectError } = await supabase
    .from("workspaces")
    .select("id, seeded_at")
    .eq("id", workspaceId)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing?.seeded_at) return;

  if (!existing) {
    const { error: insertError } = await supabase
      .from("workspaces")
      .insert({ id: workspaceId, kind: "judge" });
    // 23505 = unique_violation: another concurrent request already created this row.
    if (insertError && insertError.code !== "23505") throw insertError;
  }

  await cloneDemoDataInto(supabase, workspaceId);

  const { error: updateError } = await supabase
    .from("workspaces")
    .update({ seeded_at: new Date().toISOString() })
    .eq("id", workspaceId);
  if (updateError) throw updateError;
}
