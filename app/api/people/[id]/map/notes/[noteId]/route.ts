import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

const MAX_NOTE_LENGTH = 500;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await params;

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

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body === "object" && body !== null) {
    const b = body as Record<string, unknown>;
    if (typeof b.content === "string") {
      const trimmed = b.content.trim();
      if (!trimmed) return NextResponse.json({ error: "Note content can't be empty." }, { status: 400 });
      update.content = trimmed.slice(0, MAX_NOTE_LENGTH);
    }
    if (typeof b.positionX === "number") update.position_x = b.positionX;
    if (typeof b.positionY === "number") update.position_y = b.positionY;
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("map_notes")
    .update(update)
    .eq("id", noteId)
    .eq("workspace_id", workspaceId)
    .select("id,content,position_x,position_y")
    .maybeSingle();

  if (error) {
    console.error("Failed to update sticky note:", error);
    return NextResponse.json({ error: "Could not update this note." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  return NextResponse.json({ note: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const { noteId } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("map_notes")
    .delete()
    .eq("id", noteId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete sticky note:", error);
    return NextResponse.json({ error: "Could not delete this note." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
