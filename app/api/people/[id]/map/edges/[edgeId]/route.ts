import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

const MAX_LABEL_LENGTH = 40;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; edgeId: string }> }) {
  const { edgeId } = await params;

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

  const label =
    typeof body === "object" && body !== null && typeof (body as { label?: unknown }).label === "string"
      ? (body as { label: string }).label.trim()
      : "";
  if (!label) {
    return NextResponse.json({ error: "Label is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  // Only "custom" (user-drawn) edges can have their label edited here — a
  // Muted-derived edge's label comes from relationship_type/content, and
  // gets corrected by editing the underlying relationship_insight instead.
  const { data, error } = await supabase
    .from("map_edges")
    .update({ label: label.slice(0, MAX_LABEL_LENGTH), updated_at: new Date().toISOString() })
    .eq("id", edgeId)
    .eq("workspace_id", workspaceId)
    .eq("edge_kind", "custom")
    .select("id,label")
    .maybeSingle();

  if (error) {
    console.error("Failed to update edge label:", error);
    return NextResponse.json({ error: "Could not update this connection." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Connection not found, or it isn't editable." }, { status: 404 });
  }

  return NextResponse.json({ edge: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; edgeId: string }> }) {
  const { edgeId } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("map_edges")
    .delete()
    .eq("id", edgeId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete edge:", error);
    return NextResponse.json({ error: "Could not delete this connection." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Connection not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
