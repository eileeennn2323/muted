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

  const kind =
    typeof body === "object" && body !== null && (body as { kind?: unknown }).kind === "me" ? "me" : "person";
  const personId =
    typeof body === "object" && body !== null && typeof (body as { personId?: unknown }).personId === "string"
      ? (body as { personId: string }).personId
      : null;

  if (kind === "person" && !personId) {
    return NextResponse.json({ error: "personId is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const mapId = await resolveMapId(supabase, workspaceId, id);
  if (!mapId) {
    return NextResponse.json({ error: "No relationship map found for this person yet." }, { status: 404 });
  }

  if (kind === "person") {
    // Confirm the person actually belongs to this workspace before linking a node to them.
    const { data: person, error: personError } = await supabase
      .from("people")
      .select("id,name,roles")
      .eq("id", personId as string)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (personError) {
      console.error("Failed to look up person for new map node:", personError);
      return NextResponse.json({ error: "Could not add this person to the map." }, { status: 500 });
    }
    if (!person) {
      return NextResponse.json({ error: "Person not found." }, { status: 404 });
    }

    const newNodeId = crypto.randomUUID();
    const { error } = await supabase.from("map_nodes").insert({
      id: newNodeId,
      workspace_id: workspaceId,
      map_id: mapId,
      node_kind: "person",
      person_id: person.id,
      position_x: 0,
      position_y: 0,
    });
    if (error) {
      // 23505 = already on the map (map_nodes_one_person_per_map)
      if (error.code === "23505") {
        return NextResponse.json({ error: "That person is already on the map." }, { status: 409 });
      }
      console.error("Failed to add person node:", error);
      return NextResponse.json({ error: "Could not add this person to the map." }, { status: 500 });
    }

    return NextResponse.json({
      node: {
        id: newNodeId,
        nodeKind: "person",
        personId: person.id,
        name: person.name,
        role: person.roles?.[0] ?? null,
        positionX: 0,
        positionY: 0,
      },
    });
  }

  const newNodeId = crypto.randomUUID();
  const { error } = await supabase.from("map_nodes").insert({
    id: newNodeId,
    workspace_id: workspaceId,
    map_id: mapId,
    node_kind: "me",
    person_id: null,
    position_x: 0,
    position_y: 0,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A \"Me\" node already exists on this map." }, { status: 409 });
    }
    console.error("Failed to add Me node:", error);
    return NextResponse.json({ error: "Could not add the Me node." }, { status: 500 });
  }

  return NextResponse.json({
    node: { id: newNodeId, nodeKind: "me", personId: null, name: "Me", role: null, positionX: 0, positionY: 0 },
  });
}
