import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertConversation(
  supabase: SupabaseClient,
  workspaceId: string,
  personId: string | null
): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("conversations")
    .insert({ id, workspace_id: workspaceId, person_id: personId });
  if (error) throw error;
  return id;
}

/** The most recent conversation scoped to this person (or, when personId is
 * null, the general/page-level conversation shared by Lessons, /me, Home,
 * and the standalone /ask page) — reused for continuity across visits.
 * "New conversation" bypasses this via insertConversation directly. */
export async function getOrCreateConversation(
  supabase: SupabaseClient,
  workspaceId: string,
  personId: string | null
): Promise<string> {
  let query = supabase
    .from("conversations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1);
  query = personId ? query.eq("person_id", personId) : query.is("person_id", null);
  const { data: existing, error } = await query.maybeSingle();
  if (error) throw error;
  if (existing) return existing.id;

  return insertConversation(supabase, workspaceId, personId);
}

/** Resolves a client-supplied personId to a real, same-workspace person —
 * never trusts it blindly, since a stray/foreign id should just fall back
 * to the unscoped conversation rather than erroring or leaking anything. */
export async function resolvePerson(
  supabase: SupabaseClient,
  workspaceId: string,
  personId: string | null
): Promise<{ id: string; name: string } | null> {
  if (!personId) return null;
  const { data } = await supabase
    .from("people")
    .select("id,name")
    .eq("workspace_id", workspaceId)
    .eq("id", personId)
    .maybeSingle();
  return data ?? null;
}
