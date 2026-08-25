import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ensureWorkspaceSeeded, getWorkspaceId } from "@/lib/workspace";
import { checkAndIncrementUsage } from "@/lib/rateLimit";
import { buildMemoryContext } from "@/lib/capture/context";
import { runCaptureExtraction } from "@/lib/capture/extract";
import { applyCaptureExtraction } from "@/lib/capture/apply";

const MAX_NOTE_LENGTH = 6000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const note =
    typeof body === "object" && body !== null && typeof (body as { note?: unknown }).note === "string"
      ? (body as { note: string }).note.trim()
      : "";
  const requestedPersonId =
    typeof body === "object" && body !== null && typeof (body as { personId?: unknown }).personId === "string"
      ? (body as { personId: string }).personId
      : null;

  if (!note) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }
  if (note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: "That note is too long. Try splitting it up." }, { status: 400 });
  }

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found. Reload the page and try again." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  await ensureWorkspaceSeeded(workspaceId);

  const usage = await checkAndIncrementUsage(supabase, workspaceId, "capture");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "You've hit today's demo capture limit. Please try again tomorrow." },
      { status: 429 }
    );
  }

  // Step 1 — save the raw note before anything else, so it's preserved as
  // evidence even if analysis fails.
  const noteId = crypto.randomUUID();
  const { error: noteInsertError } = await supabase
    .from("notes")
    .insert({ id: noteId, workspace_id: workspaceId, raw_content: note });
  if (noteInsertError) {
    console.error("Failed to save note:", noteInsertError);
    return NextResponse.json({ error: "Could not save your note. Please try again." }, { status: 500 });
  }

  // Step 2 — run Gemini analysis. requestedPersonId is only ever trusted if
  // it resolves to a person already scoped to this workspace (see
  // buildMemoryContext) — an id from another workspace just resolves to null.
  const context = await buildMemoryContext(supabase, workspaceId, note, requestedPersonId);

  let extraction;
  try {
    extraction = await runCaptureExtraction(note, context);
  } catch (error) {
    console.error("Capture extraction failed:", error);
    extraction = null;
  }

  if (!extraction) {
    return NextResponse.json({
      noteId,
      pickedUp: null,
      warning: "Your note was saved, but Muted couldn't analyse it just now. Try again in a moment.",
    });
  }

  // Steps 3-5 — resolve people, update memory, save evidence.
  const pickedUp = await applyCaptureExtraction({ supabase, workspaceId, noteId, extraction, context });

  if (extraction.context_summary) {
    await supabase
      .from("notes")
      .update({ context_summary: extraction.context_summary.trim().slice(0, 300) })
      .eq("id", noteId)
      .eq("workspace_id", workspaceId);
  }

  // Step 6 — concise Picked Up result for the UI.
  return NextResponse.json({ noteId, pickedUp });
}
