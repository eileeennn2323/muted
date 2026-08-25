import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { RELATIONSHIP_ROLES } from "@/lib/people/roles";

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

  const roleRaw = typeof body === "object" && body !== null ? (body as { role?: unknown }).role : undefined;
  if (roleRaw !== null && !(RELATIONSHIP_ROLES as readonly string[]).includes(roleRaw as string)) {
    return NextResponse.json({ error: "Not a recognised relationship." }, { status: 400 });
  }
  const roles = roleRaw ? [roleRaw as string] : [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("people")
    .update({ roles })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id,name,roles")
    .maybeSingle();

  if (error) {
    console.error("Failed to update person:", error);
    return NextResponse.json({ error: "Could not update this person." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  return NextResponse.json({ person: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  // ON DELETE CASCADE on person_insights, person_insight_evidence,
  // relationship_insights, relationship_insight_evidence, note_people, and
  // lesson_people all key off people(id) — deleting the person row alone
  // cleans up everything that's about them without touching the raw notes,
  // lessons, or self-insights those rows evidenced.
  const { data, error } = await supabase
    .from("people")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete person:", error);
    return NextResponse.json({ error: "Could not delete this person." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
