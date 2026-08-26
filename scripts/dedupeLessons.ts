/**
 * One-off cleanup for lesson rows created before Capture had a way to
 * reinforce an existing lesson in place — every near-identical repeated
 * observation became its own new row (see the existing_lesson_id fix).
 * This merges lessons that share the exact same title (case/whitespace
 * insensitive) within a workspace: keeps one canonical row, re-points
 * evidence and related-people links onto it, and deletes the rest.
 *
 * Usage:
 *   npm run dedupe-lessons                       # every workspace
 *   npm run dedupe-lessons -- <workspace-id>      # just one workspace
 */
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local present — fall through to process.env as-is
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role, not anon) before running this script."
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const onlyWorkspaceId = process.argv[2];

type LessonRow = {
  id: string;
  workspace_id: string;
  title: string;
  themes: string[];
  is_inferred: boolean;
  user_edited: boolean;
  created_at: string;
};

async function main() {
  let query = supabase
    .from("lessons")
    .select("id,workspace_id,title,themes,is_inferred,user_edited,created_at")
    .order("created_at", { ascending: true });
  if (onlyWorkspaceId) query = query.eq("workspace_id", onlyWorkspaceId);

  const { data: lessons, error } = await query;
  if (error) throw error;
  if (!lessons?.length) {
    console.log("No lessons found.");
    return;
  }

  const groups = new Map<string, LessonRow[]>();
  for (const l of lessons as LessonRow[]) {
    const key = `${l.workspace_id}::${l.title.trim().toLowerCase()}`;
    const list = groups.get(key);
    if (list) list.push(l);
    else groups.set(key, [l]);
  }

  const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);
  if (duplicateGroups.length === 0) {
    console.log("No duplicate lesson titles found — nothing to do.");
    return;
  }

  let mergedCount = 0;
  let deletedCount = 0;

  for (const group of duplicateGroups) {
    // Prefer a user-edited row as the canonical one (it reflects an explicit
    // correction); otherwise keep the earliest-created row.
    const canonical = group.find((l) => l.user_edited) ?? group[0];
    const duplicates = group.filter((l) => l.id !== canonical.id);
    const duplicateIds = duplicates.map((d) => d.id);

    console.log(
      `Merging ${duplicates.length} duplicate(s) of "${canonical.title}" (workspace ${canonical.workspace_id}) into ${canonical.id}`
    );

    // Union themes across all duplicates onto the canonical row (capped at 2
    // per the lessons table's check constraint).
    const unionThemes = Array.from(new Set(group.flatMap((l) => l.themes))).slice(0, 2);
    const anyUserEdited = group.some((l) => l.user_edited);
    await supabase
      .from("lessons")
      .update({ themes: unionThemes, user_edited: anyUserEdited })
      .eq("id", canonical.id);

    // Re-point evidence links, skipping ones that would collide with a link
    // the canonical row already has (same note cited by both).
    const { data: evidenceRows } = await supabase
      .from("lesson_evidence")
      .select("lesson_id,note_id,quote")
      .in("lesson_id", duplicateIds);
    for (const row of evidenceRows ?? []) {
      await supabase
        .from("lesson_evidence")
        .upsert(
          { lesson_id: canonical.id, note_id: row.note_id, quote: row.quote },
          { onConflict: "lesson_id,note_id", ignoreDuplicates: true }
        );
    }

    // Re-point related-people links the same way.
    const { data: peopleRows } = await supabase
      .from("lesson_people")
      .select("lesson_id,person_id")
      .in("lesson_id", duplicateIds);
    for (const row of peopleRows ?? []) {
      await supabase
        .from("lesson_people")
        .upsert(
          { lesson_id: canonical.id, person_id: row.person_id },
          { onConflict: "lesson_id,person_id", ignoreDuplicates: true }
        );
    }

    const { error: deleteError, count } = await supabase
      .from("lessons")
      .delete({ count: "exact" })
      .in("id", duplicateIds);
    if (deleteError) {
      console.error(`  Failed to delete duplicates for "${canonical.title}":`, deleteError);
      continue;
    }
    mergedCount += 1;
    deletedCount += count ?? duplicateIds.length;
  }

  console.log(`Done. Merged ${mergedCount} title group(s), removed ${deletedCount} duplicate lesson row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
