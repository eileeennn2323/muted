import LessonThemeList from "@/components/lessons/LessonThemeList";
import { getLessonsByTheme } from "@/lib/lessons/queries";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getWorkspaceId } from "@/lib/workspace";

const THEMES = ["Communication", "Leadership", "Stakeholder Management", "Personal Growth"];

export default async function LessonsPage() {
  const workspaceId = await getWorkspaceId();
  const byTheme = workspaceId ? await getLessonsByTheme(getSupabaseAdmin(), workspaceId) : {};

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-cocoa-soft">Lessons</p>
      <h1 className="mt-2 font-serif text-4xl font-light tracking-tight text-cocoa">Your playbook of lessons</h1>
      <p className="mt-4 max-w-lg text-cocoa-soft">
        Reusable, people-related wisdom, organised into four themes.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {THEMES.map((theme) => {
          const themeLessons = byTheme[theme] ?? [];
          return (
            <section key={theme}>
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <h2 className="font-serif text-xl font-light text-cocoa">{theme}</h2>
                {themeLessons.length > 0 && (
                  <span className="font-mono text-[11px] text-cocoa-quiet">
                    {themeLessons.length} lesson{themeLessons.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <LessonThemeList initialLessons={themeLessons} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
