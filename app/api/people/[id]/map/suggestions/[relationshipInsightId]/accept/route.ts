import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { resolveMapId } from "@/lib/people/mapAuth";

const EDGE_KIND_LABELS: Record<string, string> = {
  reports_to: "Reports to",
  influences: "Influences",
  works_closely_with: "Works closely with",
};

function truncateLabel(text: string, max = 40): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; relationshipInsightId: string }> }
) {
  const { id, relationshipInsightId } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const mapId = await resolveMapId(supabase, workspaceId, id);
  if (!mapId) {
    return NextResponse.json({ error: "No relationship map found for this person yet." }, { status: 404 });
  }

  const { data: insight, error: insightError } = await supabase
    .from("relationship_insights")
    .select("id,person_a_id,person_b_id,content,relationship_type")
    .eq("id", relationshipInsightId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (insightError) {
    console.error("Failed to look up relationship insight for accept:", insightError);
    return NextResponse.json({ error: "Could not add this connection." }, { status: 500 });
  }
  if (!insight || (insight.person_a_id !== id && insight.person_b_id !== id)) {
    return NextResponse.json({ error: "Relationship insight not found." }, { status: 404 });
  }

  const otherPersonId = insight.person_a_id === id ? insight.person_b_id : insight.person_a_id;

  // Ensure both endpoints have a node on this map, creating the other
  // person's node if this is the first time they've appeared here.
  const { data: nodeRows, error: nodesError } = await supabase
    .from("map_nodes")
    .select("id,person_id")
    .eq("map_id", mapId)
    .in("person_id", [id, otherPersonId]);
  if (nodesError) {
    console.error("Failed to look up nodes for accept:", nodesError);
    return NextResponse.json({ error: "Could not add this connection." }, { status: 500 });
  }

  let focusNodeId = nodeRows?.find((n) => n.person_id === id)?.id;
  let otherNodeId = nodeRows?.find((n) => n.person_id === otherPersonId)?.id;

  if (!focusNodeId) {
    const { data: focusPerson } = await supabase.from("people").select("id").eq("id", id).maybeSingle();
    if (!focusPerson) return NextResponse.json({ error: "Person not found." }, { status: 404 });
    focusNodeId = crypto.randomUUID();
    await supabase
      .from("map_nodes")
      .insert({ id: focusNodeId, workspace_id: workspaceId, map_id: mapId, node_kind: "person", person_id: id });
  }
  if (!otherNodeId) {
    otherNodeId = crypto.randomUUID();
    await supabase.from("map_nodes").insert({
      id: otherNodeId,
      workspace_id: workspaceId,
      map_id: mapId,
      node_kind: "person",
      person_id: otherPersonId,
    });
  }

  const edgeKind = insight.relationship_type ?? "custom";
  const label = insight.relationship_type
    ? EDGE_KIND_LABELS[insight.relationship_type]
    : truncateLabel(insight.content as string);

  // Idempotent via map_edges_one_per_insight: a double-click / second tab
  // just gets the existing edge back instead of erroring or duplicating.
  const { data: newEdge, error: edgeError } = await supabase
    .from("map_edges")
    .upsert(
      {
        id: crypto.randomUUID(),
        workspace_id: workspaceId,
        map_id: mapId,
        source_node_id: insight.person_a_id === id ? focusNodeId : otherNodeId,
        target_node_id: insight.person_a_id === id ? otherNodeId : focusNodeId,
        label,
        edge_kind: edgeKind,
        source_relationship_insight_id: insight.id,
        created_by: "muted",
      },
      { onConflict: "source_relationship_insight_id", ignoreDuplicates: false }
    )
    .select("id,source_node_id,target_node_id,label,edge_kind,source_relationship_insight_id,created_by")
    .maybeSingle();

  if (edgeError) {
    console.error("Failed to accept suggestion:", edgeError);
    return NextResponse.json({ error: "Could not add this connection." }, { status: 500 });
  }
  if (!newEdge) {
    return NextResponse.json({ error: "Could not add this connection." }, { status: 500 });
  }

  return NextResponse.json({
    edge: {
      id: newEdge.id,
      sourceNodeId: newEdge.source_node_id,
      targetNodeId: newEdge.target_node_id,
      label: newEdge.label,
      content: insight.content as string,
      edgeKind: newEdge.edge_kind,
      sourceRelationshipInsightId: newEdge.source_relationship_insight_id,
      createdBy: newEdge.created_by,
    },
  });
}
