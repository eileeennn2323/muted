import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const DAILY_LIMIT = 30;

type UsageKind = "capture" | "ask";

export async function checkAndIncrementUsage(
  supabase: SupabaseClient,
  workspaceId: string,
  kind: UsageKind
): Promise<{ allowed: boolean }> {
  const today = new Date().toISOString().slice(0, 10);
  const countColumn = kind === "capture" ? "capture_count" : "ask_count";

  const { data: existing, error: selectError } = await supabase
    .from("session_usage")
    .select("capture_count, ask_count")
    .eq("workspace_id", workspaceId)
    .eq("day", today)
    .maybeSingle();
  if (selectError) throw selectError;

  const currentCount = existing ? ((existing as Record<string, number>)[countColumn] ?? 0) : 0;
  if (currentCount >= DAILY_LIMIT) {
    return { allowed: false };
  }

  if (existing) {
    await supabase
      .from("session_usage")
      .update({ [countColumn]: currentCount + 1 })
      .eq("workspace_id", workspaceId)
      .eq("day", today);
  } else {
    await supabase.from("session_usage").insert({ workspace_id: workspaceId, day: today, [countColumn]: 1 });
  }

  return { allowed: true };
}
