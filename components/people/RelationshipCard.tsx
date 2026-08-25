"use client";

import { useState } from "react";
import type { PlaybookRelationship } from "@/lib/people/queries";
import InsightCard from "./InsightCard";

export default function RelationshipCard({ relationship }: { relationship: PlaybookRelationship }) {
  const [item, setItem] = useState(relationship);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  return (
    <div className="rounded-2xl border border-border bg-paper p-4">
      <p className="text-[14px] font-medium text-cocoa">{item.otherPersonName}</p>
      <ul className="mt-1">
        <InsightCard
          insight={item}
          endpointBase="/api/relationship-insights"
          onUpdated={(updated) => setItem((prev) => ({ ...prev, ...updated }))}
          onDeleted={() => setDeleted(true)}
        />
      </ul>
    </div>
  );
}
