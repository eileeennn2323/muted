import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

const MAX_TITLE_LENGTH = 140;
const MAX_EXPLANATION_LENGTH = 300;

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

  const title =
    typeof body === "object" && body !== null && typeof (body as { title?: unknown }).title === "string"
      ? (body as { title: string }).title.trim()
      : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: "That title is too long." }, { status: 400 });
  }

  const explanationRaw =
    typeof body === "object" && body !== null ? (body as { explanation?: unknown }).explanation : null;
  const explanation = typeof explanationRaw === "string" ? explanationRaw.trim().slice(0, MAX_EXPLANATION_LENGTH) || null : null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("lessons")
    .update({
      title,
      explanation,
      user_edited: true,
      is_inferred: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id,title,explanation,is_inferred,user_edited")
    .maybeSingle();

  if (error) {
    console.error("Failed to update lesson:", error);
    return NextResponse.json({ error: "Could not update this lesson." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json({ lesson: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete lesson:", error);
    return NextResponse.json({ error: "Could not delete this lesson." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
