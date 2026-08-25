import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { resolveMapId } from "@/lib/people/mapAuth";

const MAX_LABEL_LENGTH = 40;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sourceNodeId =
    typeof body === "object" && body !== null && typeof (body as { sourceNodeId?: unknown }).sourceNodeId === "string"
      ? (body as { sourceNodeId: string }).sourceNodeId
      : null;
  const targetNodeId =
    typeof body === "object" && body !== null && typeof (body as { targetNodeId?: unknown }).targetNodeId === "string"
      ? (body as { targetNodeId: string }).targetNodeId
      : null;
  const labelRaw =
    typeof body === "object" && body !== null && typeof (body as { label?: unknown }).label === "string"
      ? (body as { label: string }).label.trim()
      : "";

  if (!sourceNodeId || !targetNodeId) {
    return NextResponse.json({ error: "sourceNodeId and targetNodeId are required." }, { status: 400 });
  }
  if (sourceNodeId === targetNodeId) {
    return NextResponse.json({ error: "A connection needs two different nodes." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const mapId = await resolveMapId(supabase, workspaceId, id);
  if (!mapId) {
    return NextResponse.json({ error: "No relationship map found for this person yet." }, { status: 404 });
  }

  // Hardening: both nodes must actually belong to this exact map before we
  // let the client wire an edge between them.
  const { data: nodeRows, error: nodesError } = await supabase
    .from("map_nodes")
    .select("id")
    .eq("map_id", mapId)
    .eq("workspace_id", workspaceId)
    .in("id", [sourceNodeId, targetNodeId]);
  if (nodesError) {
    console.error("Failed to verify nodes for new edge:", nodesError);
    return NextResponse.json({ error: "Could not create this connection." }, { status: 500 });
  }
  if ((nodeRows ?? []).length !== 2) {
    return NextResponse.json({ error: "Both nodes must be on this map." }, { status: 400 });
  }

  const newEdgeId = crypto.randomUUID();
  const { error } = await supabase.from("map_edges").insert({
    id: newEdgeId,
    workspace_id: workspaceId,
    map_id: mapId,
    source_node_id: sourceNodeId,
    target_node_id: targetNodeId,
    label: labelRaw.slice(0, MAX_LABEL_LENGTH) || "Your annotation",
    edge_kind: "custom",
    source_relationship_insight_id: null,
    created_by: "user",
  });
  if (error) {
    console.error("Failed to create edge:", error);
    return NextResponse.json({ error: "Could not create this connection." }, { status: 500 });
  }

  return NextResponse.json({
    edge: {
      id: newEdgeId,
      sourceNodeId,
      targetNodeId,
      label: labelRaw.slice(0, MAX_LABEL_LENGTH) || "Your annotation",
      content: null,
      edgeKind: "custom",
      sourceRelationshipInsightId: null,
      createdBy: "user",
    },
  });
}
