import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolves a person's relationship_maps id, scoped to the workspace — used
 * by routes that create a new node/edge/note and need the map to attach it
 * to. Returns null if no map exists yet for this person (the GET route is
 * what creates one, via getOrCreateRelationshipMap). */
export async function resolveMapId(
  supabase: SupabaseClient,
  workspaceId: string,
  focusPersonId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("relationship_maps")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("focus_person_id", focusPersonId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}
