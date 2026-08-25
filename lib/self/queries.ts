import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchEvidenceMap, type EditableInsight } from "@/lib/evidence";

export type SelfInsightItem = EditableInsight & { type: string };

export async function getSelfInsightsByType(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<Record<string, SelfInsightItem[]>> {
  const { data: insights, error } = await supabase
    .from("self_insights")
    .select("id,type,content,confidence,is_inferred,user_edited")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!insights?.length) return {};

  const evidenceById = await fetchEvidenceMap(supabase, "self_insight_evidence", "self_insight_id", insights.map((i) => i.id));

  const byType: Record<string, SelfInsightItem[]> = {};
  for (const insight of insights) {
    const item: SelfInsightItem = {
      id: insight.id,
      type: insight.type,
      content: insight.content,
      confidence: insight.confidence,
      isInferred: insight.is_inferred,
      userEdited: insight.user_edited,
      evidence: evidenceById.get(insight.id) ?? [],
    };
    (byType[insight.type] ??= []).push(item);
  }
  return byType;
}
