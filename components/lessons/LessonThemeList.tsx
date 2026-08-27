"use client";

import { useState } from "react";
import type { LessonItem } from "@/lib/lessons/queries";
import LessonCard from "./LessonCard";

export default function LessonThemeList({ initialLessons }: { initialLessons: LessonItem[] }) {
  const [items, setItems] = useState(initialLessons);

  // Same reason as InsightList: useState's initial value only applies on
  // first mount, so a router.refresh() elsewhere on the page never reaches
  // this list's local state without adjusting it during render.
  const [prevLessons, setPrevLessons] = useState(initialLessons);
  if (initialLessons !== prevLessons) {
    setPrevLessons(initialLessons);
    setItems(initialLessons);
  }

  if (items.length === 0) {
    return <p className="text-sm text-cocoa-faint">Nothing yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((lesson) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          onDeleted={(id) => setItems((prev) => prev.filter((l) => l.id !== id))}
        />
      ))}
    </div>
  );
}
