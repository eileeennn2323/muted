import InsightList from "@/components/people/InsightList";
import LessonThemeList from "@/components/lessons/LessonThemeList";
import { getLessonsByTheme } from "@/lib/lessons/queries";
import { getSelfInsightsByType } from "@/lib/self/queries";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

const SECTIONS = [
  { type: "pattern", title: "Patterns" },
  { type: "strength", title: "Strengths" },
  { type: "watch_out", title: "Watch Outs" },
  { type: "working_on", title: "Working On" },
];

export default async function MePage() {
  const workspaceId = await getWorkspaceId();
  const supabase = getSupabaseAdmin();
  const byType = workspaceId ? await getSelfInsightsByType(supabase, workspaceId) : {};
  const relevantLessons = workspaceId ? (await getLessonsByTheme(supabase, workspaceId))["Personal Growth"] ?? [] : [];

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-cocoa-soft">Me</p>
      <h1 className="mt-2 font-serif text-4xl font-light tracking-tight text-cocoa">About you</h1>
      <p className="mt-4 max-w-lg text-cocoa-soft">
        A working understanding of your own habits — not a personality test.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.type} className="rounded-2xl border border-border bg-paper p-6">
            <p className="font-serif text-lg font-light text-cocoa">{section.title}</p>
            <div className="mt-3">
              <InsightList insights={byType[section.type] ?? []} endpointBase="/api/self-insights" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-xl font-light text-cocoa">Relevant lessons</h2>
        <p className="mt-1 text-[13.5px] text-cocoa-soft">Lessons repeatedly connected to your own behaviour.</p>
        <div className="mt-4">
          <LessonThemeList initialLessons={relevantLessons} />
        </div>
      </div>
    </div>
  );
}
