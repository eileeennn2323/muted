import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { resolveMapId } from "@/lib/people/mapAuth";

const MAX_NOTE_LENGTH = 500;

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

  const content =
    typeof body === "object" && body !== null && typeof (body as { content?: unknown }).content === "string"
      ? (body as { content: string }).content.trim()
      : "";
  const positionX =
    typeof body === "object" && body !== null && typeof (body as { positionX?: unknown }).positionX === "number"
      ? (body as { positionX: number }).positionX
      : 0;
  const positionY =
    typeof body === "object" && body !== null && typeof (body as { positionY?: unknown }).positionY === "number"
      ? (body as { positionY: number }).positionY
      : 0;

  if (!content) {
    return NextResponse.json({ error: "Note content is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const mapId = await resolveMapId(supabase, workspaceId, id);
  if (!mapId) {
    return NextResponse.json({ error: "No relationship map found for this person yet." }, { status: 404 });
  }

  const newNoteId = crypto.randomUUID();
  const { error } = await supabase.from("map_notes").insert({
    id: newNoteId,
    workspace_id: workspaceId,
    map_id: mapId,
    content: content.slice(0, MAX_NOTE_LENGTH),
    position_x: positionX,
    position_y: positionY,
  });
  if (error) {
    console.error("Failed to create sticky note:", error);
    return NextResponse.json({ error: "Could not create this note." }, { status: 500 });
  }

  return NextResponse.json({
    note: { id: newNoteId, content: content.slice(0, MAX_NOTE_LENGTH), positionX, positionY },
  });
}
