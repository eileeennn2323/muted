"use client";

import { useMemo, useState } from "react";
import type { MapNodeData } from "./types";

export default function AddPersonToMapDialog({
  personId,
  workspacePeople,
  excludeIds,
  onClose,
  onAdded,
}: {
  personId: string;
  workspacePeople: { id: string; name: string; roles: string[] }[];
  excludeIds: Set<string>;
  onClose: () => void;
  onAdded: (node: MapNodeData) => void;
}) {
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(() => {
    const available = workspacePeople.filter((p) => !excludeIds.has(p.id));
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((p) => p.name.toLowerCase().includes(q));
  }, [workspacePeople, excludeIds, query]);

  async function addExisting(existingPersonId: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/people/${personId}/map/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: existingPersonId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add this person.");
        return;
      }
      onAdded(data.node);
      onClose();
    } catch {
      setError("Couldn't reach Muted.");
    } finally {
      setSaving(false);
    }
  }

  async function addNew() {
    const name = query.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const personRes = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const personData = await personRes.json();
      if (!personRes.ok) {
        setError(personData.error ?? "Could not create this person.");
        return;
      }
      await addExisting(personData.id);
    } catch {
      setError("Couldn't reach Muted.");
      setSaving(false);
    }
  }

  const exactMatch = candidates.some((p) => p.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/25 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-paper p-6 shadow-2xl">
        <h2 className="font-serif text-xl font-light text-cocoa">Add a person to the map</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or type a new name"
          autoFocus
          disabled={saving}
          className="mt-4 w-full rounded-lg border border-border bg-cream px-3.5 py-2.5 text-[14px] text-cocoa outline-none focus:border-cedar disabled:opacity-70"
        />

        <div className="mt-3 flex max-h-56 flex-col gap-1 overflow-y-auto">
          {candidates.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addExisting(p.id)}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-left text-[13.5px] text-cocoa-body hover:bg-sand disabled:opacity-60"
            >
              {p.name}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={addNew}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-left text-[13.5px] text-cedar-dark hover:bg-sand disabled:opacity-60"
            >
              + Create &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-[13px] text-ochre">{error}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-border px-4 py-2 text-[13.5px] text-cocoa-soft disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
