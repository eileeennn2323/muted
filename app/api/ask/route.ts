import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ensureWorkspaceSeeded, getWorkspaceId } from "@/lib/workspace";
import { checkAndIncrementUsage } from "@/lib/rateLimit";
import { buildAskContext } from "@/lib/ask/context";
import { runAskResponse } from "@/lib/ask/respond";
import { truncate } from "@/lib/evidence";

const MAX_MESSAGE_LENGTH = 2000;

/** One ongoing conversation per workspace — enough for the hackathon scope;
 * matches "chat history = conversational continuity" from the masterplan
 * without building a conversation list UI. */
async function getOrCreateConversation(supabase: SupabaseClient, workspaceId: string): Promise<string> {
  const { data: existing, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  const { error: insertError } = await supabase.from("conversations").insert({ id, workspace_id: workspaceId });
  if (insertError) throw insertError;
  return id;
}

function safeApproachOnly(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.approach === "string") return parsed.approach;
  } catch {
    // pre-structured or plain content — fall through and use as-is
  }
  return content;
}

export async function GET() {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  await ensureWorkspaceSeeded(workspaceId);
  const conversationId = await getOrCreateConversation(supabase, workspaceId);

  const { data: messages, error } = await supabase
    .from("conversation_messages")
    .select("id,role,content,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Failed to load conversation:", error);
    return NextResponse.json({ error: "Could not load conversation." }, { status: 500 });
  }

  return NextResponse.json({ conversationId, messages: messages ?? [] });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message =
    typeof body === "object" && body !== null && typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message.trim()
      : "";
  if (!message) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "That message is too long." }, { status: 400 });
  }

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found. Reload the page and try again." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  await ensureWorkspaceSeeded(workspaceId);

  const usage = await checkAndIncrementUsage(supabase, workspaceId, "ask");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "You've hit today's demo question limit. Please try again tomorrow." },
      { status: 429 }
    );
  }

  const conversationId = await getOrCreateConversation(supabase, workspaceId);

  const { data: priorMessages, error: historyError } = await supabase
    .from("conversation_messages")
    .select("role,content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (historyError) console.error("Failed to load conversation history:", historyError);

  const history = (priorMessages ?? []).slice(-8).map((m) => ({
    role: m.role,
    content: m.role === "assistant" ? safeApproachOnly(m.content) : m.content,
  }));

  const { error: userInsertError } = await supabase.from("conversation_messages").insert({
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    role: "user",
    content: message,
  });
  if (userInsertError) {
    console.error("Failed to save user message:", userInsertError);
    return NextResponse.json({ error: "Could not save your message." }, { status: 500 });
  }

  const context = await buildAskContext(supabase, workspaceId);

  let answer;
  try {
    answer = await runAskResponse(message, context, history);
  } catch (error) {
    console.error("Ask Muted generation failed:", error);
    answer = null;
  }

  if (!answer) {
    return NextResponse.json({
      conversationId,
      message: null,
      warning: "Muted couldn't work out an answer just now. Try again in a moment.",
    });
  }

  const noteIds = answer.based_on_note_ids;
  let basedOn: { noteId: string; createdAt: string; quote: string }[] = [];
  if (noteIds.length > 0) {
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id,created_at,raw_content")
      .in("id", noteIds);
    if (notesError) console.error("Failed to resolve based-on notes:", notesError);
    basedOn = (notes ?? []).map((n) => ({ noteId: n.id, createdAt: n.created_at, quote: truncate(n.raw_content) }));
  }

  const assistantContent = {
    approach: answer.approach,
    expect: answer.expect,
    avoid: answer.avoid,
    watchYourself: answer.watch_yourself,
    basedOn,
  };

  const assistantId = crypto.randomUUID();
  const { error: assistantInsertError } = await supabase.from("conversation_messages").insert({
    id: assistantId,
    conversation_id: conversationId,
    role: "assistant",
    content: JSON.stringify(assistantContent),
    based_on_note_ids: noteIds,
  });
  if (assistantInsertError) console.error("Failed to save assistant message:", assistantInsertError);

  return NextResponse.json({
    conversationId,
    message: { id: assistantId, role: "assistant", content: assistantContent },
  });
}
