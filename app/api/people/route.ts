import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ensureWorkspaceSeeded, getWorkspaceId } from "@/lib/workspace";

const MAX_NAME_LENGTH = 100;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name =
    typeof body === "object" && body !== null && typeof (body as { name?: unknown }).name === "string"
      ? (body as { name: string }).name.trim()
      : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "That name is too long." }, { status: 400 });
  }

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found. Reload the page and try again." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  await ensureWorkspaceSeeded(workspaceId);

  const { data: existing } = await supabase
    .from("people")
    .select("id")
    .eq("workspace_id", workspaceId)
    .ilike("name", name)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `${name} is already in your People list.` }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("people")
    .insert({ id, workspace_id: workspaceId, name, roles: [], aliases: [] });
  if (error) {
    console.error("Failed to create person:", error);
    return NextResponse.json({ error: "Could not create this person." }, { status: 500 });
  }

  return NextResponse.json({ id, name });
}
