import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { resolveMapId } from "@/lib/people/mapAuth";

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

  const otherPersonId =
    typeof body === "object" && body !== null && typeof (body as { otherPersonId?: unknown }).otherPersonId === "string"
      ? (body as { otherPersonId: string }).otherPersonId
      : null;
  if (!otherPersonId) {
    return NextResponse.json({ error: "otherPersonId is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const mapId = await resolveMapId(supabase, workspaceId, id);
  if (!mapId) {
    return NextResponse.json({ error: "No relationship map found for this person yet." }, { status: 404 });
  }

  const { data: people, error: peopleError } = await supabase
    .from("people")
    .select("id,name")
    .eq("workspace_id", workspaceId)
    .in("id", [id, otherPersonId]);
  if (peopleError) {
    console.error("Failed to look up people for co-occurrence accept:", peopleError);
    return NextResponse.json({ error: "Could not add this connection." }, { status: 500 });
  }
  const focusPerson = people?.find((p) => p.id === id);
  const otherPerson = people?.find((p) => p.id === otherPersonId);
  if (!focusPerson || !otherPerson) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  // Find the notes both people actually appear in — this is what grounds
  // the new relationship_insight's evidence.
  const { data: focusNoteLinks, error: focusNotesError } = await supabase
    .from("note_people")
    .select("note_id")
    .eq("person_id", id);
  if (focusNotesError) {
    console.error("Failed to look up focus person's notes:", focusNotesError);
    return NextResponse.json({ error: "Could not add this connection." }, { status: 500 });
  }
  const focusNoteIds = (focusNoteLinks ?? []).map((r) => r.note_id as string);

  const { data: sharedLinks, error: sharedError } = await supabase
    .from("note_people")
    .select("note_id")
    .eq("person_id", otherPersonId)
    .in("note_id", focusNoteIds.length > 0 ? focusNoteIds : ["00000000-0000-0000-0000-000000000000"]);
  if (sharedError) {
    console.error("Failed to look up shared notes:", sharedError);
    return NextResponse.json({ error: "Could not add this connection." }, { status: 500 });
  }
  const sharedNoteIds = (sharedLinks ?? []).map((r) => r.note_id as string);

  const newInsightId = crypto.randomUUID();
  const content = `${focusPerson.name} and ${otherPerson.name} are mentioned together across multiple notes.`;
  const { error: insightError } = await supabase.from("relationship_insights").insert({
    id: newInsightId,
    workspace_id: workspaceId,
    person_a_id: id,
    person_b_id: otherPersonId,
    content,
    confidence: "low",
    is_inferred: true,
    user_edited: false,
    relationship_type: null,
  });
  if (insightError) {
    console.error("Failed to create co-occurrence relationship insight:", insightError);
    return NextResponse.json({ error: "Could not add this connection." }, { status: 500 });
  }

  if (sharedNoteIds.length > 0) {
    await supabase.from("relationship_insight_evidence").insert(
      sharedNoteIds.map((noteId) => ({ relationship_insight_id: newInsightId, note_id: noteId, quote: null }))
    );
  }

  // Ensure both nodes exist on the map (same pattern as the other accept route).
  const { data: nodeRows } = await supabase
    .from("map_nodes")
    .select("id,person_id")
    .eq("map_id", mapId)
    .in("person_id", [id, otherPersonId]);

  let focusNodeId = nodeRows?.find((n) => n.person_id === id)?.id;
  let otherNodeId = nodeRows?.find((n) => n.person_id === otherPersonId)?.id;

  if (!focusNodeId) {
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

  const newEdgeId = crypto.randomUUID();
  const { data: newEdge, error: edgeError } = await supabase
    .from("map_edges")
    .insert({
      id: newEdgeId,
      workspace_id: workspaceId,
      map_id: mapId,
      source_node_id: focusNodeId,
      target_node_id: otherNodeId,
      label: "Mentioned together",
      edge_kind: "custom",
      source_relationship_insight_id: newInsightId,
      created_by: "muted",
    })
    .select("id,source_node_id,target_node_id,label,edge_kind,source_relationship_insight_id,created_by")
    .maybeSingle();

  if (edgeError) {
    console.error("Failed to create co-occurrence map edge:", edgeError);
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
      content,
      edgeKind: newEdge.edge_kind,
      sourceRelationshipInsightId: newEdge.source_relationship_insight_id,
      createdBy: newEdge.created_by,
    },
  });
}
