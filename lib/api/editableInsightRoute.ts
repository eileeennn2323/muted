import "server-only";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

const MAX_CONTENT_LENGTH = 300;

/**
 * Person insights, relationship insights, and self-insights all share the
 * same correctable shape (id, content, confidence, is_inferred, user_edited)
 * and the same edit/delete semantics — this factory avoids writing the same
 * PATCH/DELETE handler three times.
 */
export function createEditableInsightRoutes(table: string) {
  async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      .from(table)
      .update({
        content,
        user_edited: true,
        is_inferred: false,
        confidence: "high",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("id,content,confidence,is_inferred,user_edited")
      .maybeSingle();

    if (error) {
      console.error(`Failed to update ${table}:`, error);
      return NextResponse.json({ error: "Could not update this insight." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Insight not found." }, { status: 404 });
    }

    return NextResponse.json({ insight: data });
  }

  async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const workspaceId = await getWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "No session found." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(`Failed to delete ${table}:`, error);
      return NextResponse.json({ error: "Could not delete this insight." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Insight not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  return { PATCH, DELETE };
}
