import type { PersonLesson } from "@/lib/people/queries";
import { SeedlingIcon } from "./icons";

export default function PersonLessons({ lessons }: { lessons: PersonLesson[] }) {
  if (lessons.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border border-border bg-paper p-5">
      <div className="flex items-center gap-2.5">
        <span className="text-cedar">
          <SeedlingIcon />
        </span>
        <p className="text-[15px] text-cocoa">Things worth learning from them</p>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {lessons.map((lesson) => (
          <li key={lesson.id} className="flex items-start gap-2">
            <span aria-hidden className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-cocoa-faint" />
            <p className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-cocoa-body">
              {lesson.title}
              {lesson.isInferred && (
                <span
                  aria-hidden
                  title="Muted inferred"
                  className="ml-1.5 inline-block h-[5px] w-[5px] rounded-full bg-brass align-middle"
                />
              )}
              {lesson.explanation && <span className="block text-[13px] text-cocoa-soft">{lesson.explanation}</span>}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
