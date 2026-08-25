import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";
import { getOrCreateRelationshipMap } from "@/lib/people/relationshipMap";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No session found." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  try {
    const map = await getOrCreateRelationshipMap(supabase, workspaceId, id);
    return NextResponse.json(map);
  } catch (error) {
    console.error("Failed to load relationship map:", error);
    return NextResponse.json({ error: "Could not load the relationship map." }, { status: 500 });
  }
}
