import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

const MAX_CONTENT_LENGTH = 300;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  if (!content) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: "That's too long." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("person_insights")
    .update({
      content,
      user_edited: true,
      is_inferred: false,
      confidence: "high",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id,type,content,confidence,is_inferred,user_edited")
    .maybeSingle();

  if (error) {
    console.error("Failed to update insight:", error);
    return NextResponse.json({ error: "Could not update this insight." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Insight not found." }, { status: 404 });
  }

  return NextResponse.json({ insight: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  // .delete() doesn't error when the where-clause matches zero rows (e.g. an
  // id from another workspace), so select the deleted row back to tell
  // "actually deleted" apart from "matched nothing" — same as PATCH's 404.
  const { data, error } = await supabase
    .from("person_insights")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete insight:", error);
    return NextResponse.json({ error: "Could not delete this insight." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Insight not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
