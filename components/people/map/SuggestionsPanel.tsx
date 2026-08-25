"use client";

import { useEffect, useState } from "react";
import type { MapSuggestion } from "./types";

export default function SuggestionsPanel({
  personId,
  onAccepted,
}: {
  personId: string;
  onAccepted: (edge: { id: string; sourceNodeId: string; targetNodeId: string; label: string; edgeKind: string; sourceRelationshipInsightId: string | null; createdBy: string }) => void;
}) {
  const [suggestions, setSuggestions] = useState<MapSuggestion[] | null>(null);
  const [acceptingKey, setAcceptingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/people/${personId}/map/suggestions`);
        const data = await res.json();
        if (cancelled || !res.ok) return;
        setSuggestions([...(data.existingInsights ?? []), ...(data.coOccurrences ?? [])]);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personId]);

  function keyFor(s: MapSuggestion) {
    return s.kind === "existing_insight" ? `ei-${s.relationshipInsightId}` : `co-${s.otherPersonId}`;
  }

  async function accept(s: MapSuggestion) {
    const key = keyFor(s);
    setAcceptingKey(key);
    try {
      const url =
        s.kind === "existing_insight"
          ? `/api/people/${personId}/map/suggestions/${s.relationshipInsightId}/accept`
          : `/api/people/${personId}/map/suggestions/co-occurrence/accept`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: s.kind === "co_occurrence" ? JSON.stringify({ otherPersonId: s.otherPersonId }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) return;
      onAccepted(data.edge);
      setSuggestions((prev) => (prev ?? []).filter((item) => keyFor(item) !== key));
    } finally {
      setAcceptingKey(null);
    }
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 rounded-2xl border border-border bg-paper p-4 md:w-64">
      <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-cocoa">
        <span className="text-brass">✦</span> Insights from Muted
      </p>

      {suggestions === null && <p className="text-[12.5px] text-cocoa-faint">Looking…</p>}
      {suggestions !== null && suggestions.length === 0 && (
        <p className="text-[12.5px] text-cocoa-faint">Nothing new to suggest right now.</p>
      )}

      {(suggestions ?? []).map((s) => {
        const key = keyFor(s);
        const accepting = acceptingKey === key;
        return (
          <div
            key={key}
            className={`rounded-xl p-3 ${s.kind === "existing_insight" ? "bg-sage" : "bg-brass-solid/40"}`}
          >
            <p className="font-mono text-[10px] tracking-wide text-cocoa-quiet uppercase">
              {s.kind === "existing_insight"
                ? `Mentioned in ${s.evidenceCount} note${s.evidenceCount === 1 ? "" : "s"}`
                : `Mentioned together in ${s.noteCount} notes`}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-cocoa-body">
              {s.kind === "existing_insight" ? s.content : `You keep mentioning ${s.otherPersonName} alongside this person, but there's no connection between them yet.`}
            </p>
            <button
              type="button"
              onClick={() => accept(s)}
              disabled={accepting}
              className={`mt-2.5 rounded-full px-3 py-1.5 text-[12px] font-medium disabled:opacity-60 ${
                s.kind === "existing_insight" ? "bg-cedar text-cream" : "bg-brass-solid text-brass-ink"
              }`}
            >
              {accepting ? "Adding…" : s.kind === "existing_insight" ? "+ Add connection" : "+ Add to map"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
