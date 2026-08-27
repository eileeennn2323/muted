import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { insertConversation, resolvePerson } from "@/lib/ask/conversation";

export async function POST(request: Request) {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const requestedPersonId =
    typeof body === "object" && body !== null && typeof (body as { personId?: unknown }).personId === "string"
      ? (body as { personId: string }).personId
      : null;

  const supabase = getSupabaseAdmin();
  const person = await resolvePerson(supabase, workspaceId, requestedPersonId);
  const conversationId = await insertConversation(supabase, workspaceId, person?.id ?? null);

  return NextResponse.json({ conversationId });
}
