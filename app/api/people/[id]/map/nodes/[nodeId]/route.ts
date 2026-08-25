import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; nodeId: string }> }) {
  const { nodeId } = await params;

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

  const positionX =
    typeof body === "object" && body !== null && typeof (body as { positionX?: unknown }).positionX === "number"
      ? (body as { positionX: number }).positionX
      : null;
  const positionY =
    typeof body === "object" && body !== null && typeof (body as { positionY?: unknown }).positionY === "number"
      ? (body as { positionY: number }).positionY
      : null;

  if (positionX === null || positionY === null) {
    return NextResponse.json({ error: "positionX and positionY are required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("map_nodes")
    .update({ position_x: positionX, position_y: positionY, updated_at: new Date().toISOString() })
    .eq("id", nodeId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to update node position:", error);
    return NextResponse.json({ error: "Could not save the node position." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Node not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; nodeId: string }> }) {
  const { nodeId } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  // Deleting a node cascades to any map_edges attached to it (source or target).
  const { data, error } = await supabase
    .from("map_nodes")
    .delete()
    .eq("id", nodeId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete node:", error);
    return NextResponse.json({ error: "Could not delete this node." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Node not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
