"use client";

import { useState } from "react";
import InsightCard from "./InsightCard";
import type { EditableInsight } from "@/lib/evidence";

export default function InsightList({
  insights,
  endpointBase,
  emptyLabel = "Nothing yet.",
}: {
  insights: EditableInsight[];
  endpointBase?: string;
  emptyLabel?: string;
}) {
  const [items, setItems] = useState(insights);

  // useState's initial value only applies on first mount — without this,
  // a router.refresh() elsewhere on the page (e.g. after Add Note) fetches
  // fresh insights server-side, but this already-mounted component never
  // sees them until a full page reload. Adjusting state during render
  // (rather than in an effect) avoids the extra render pass.
  const [prevInsights, setPrevInsights] = useState(insights);
  if (insights !== prevInsights) {
    setPrevInsights(insights);
    setItems(insights);
  }

  if (items.length === 0) {
    return <p className="py-1 text-[13.5px] text-cocoa-faint">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          endpointBase={endpointBase}
          onUpdated={(updated) =>
            setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)))
          }
          onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      ))}
    </ul>
  );
}
