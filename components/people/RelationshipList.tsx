"use client";

import { useState } from "react";
import type { PlaybookRelationship } from "@/lib/people/queries";
import RelationshipRow from "./RelationshipRow";

export default function RelationshipList({ initialRelationships }: { initialRelationships: PlaybookRelationship[] }) {
  const [items, setItems] = useState(initialRelationships);

  if (items.length === 0) {
    return <p className="py-1 text-[13.5px] text-cocoa-faint">Nothing yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((r) => (
        <RelationshipRow
          key={r.id}
          relationship={r}
          onDeleted={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
    </ul>
  );
}
