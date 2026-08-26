"use client";

import { useState } from "react";
import type { MapEdgeData } from "./types";

export default function EdgeDetailDialog({
  edge,
  personId,
  onClose,
  onUpdated,
  onDeleted,
}: {
  edge: MapEdgeData;
  personId: string;
  onClose: () => void;
  onUpdated: (patch: { id: string; label?: string; content?: string }) => void;
  onDeleted: (edgeId: string) => void;
}) {
  const isMuted = edge.createdBy === "muted" && Boolean(edge.sourceRelationshipInsightId);
  const initialText = isMuted ? (edge.content ?? edge.label) : edge.label;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    setError(null);
    try {
      const url = isMuted
        ? `/api/relationship-insights/${edge.sourceRelationshipInsightId}`
        : `/api/people/${personId}/map/edges/${edge.id}`;
      const body = isMuted ? { content: text } : { label: text };
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      onUpdated(isMuted ? { id: edge.id, content: data.insight.content } : { id: edge.id, label: data.edge.label });
      setEditing(false);
      onClose();
    } catch {
      setError("Couldn't reach Muted.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    const confirmText = isMuted
      ? "Delete this relationship? This removes it everywhere, not just from the map."
      : "Remove this connection from the map?";
    if (!window.confirm(confirmText)) return;
    setDeleting(true);
    setError(null);
    try {
      const url = isMuted
        ? `/api/relationship-insights/${edge.sourceRelationshipInsightId}`
        : `/api/people/${personId}/map/edges/${edge.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not delete.");
        return;
      }
      onDeleted(edge.id);
      onClose();
    } catch {
      setError("Couldn't reach Muted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-cocoa/25 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-paper p-6 shadow-2xl">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            disabled={saving}
            className="w-full resize-y rounded-lg border border-border bg-cream p-2.5 text-[14px] text-cocoa-body outline-none focus:border-cedar disabled:opacity-70"
          />
        ) : (
          <p className="text-[14.5px] leading-relaxed text-cocoa-body">{initialText}</p>
        )}

        {error && <p className="mt-2 text-[13px] text-ochre">{error}</p>}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="rounded-full px-3 py-1.5 text-[13px] text-ochre hover:bg-ochre/10 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : isMuted ? "Delete relationship" : "Remove connection"}
          </button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(initialText);
                    setEditing(false);
                    setError(null);
                  }}
                  disabled={saving}
                  className="rounded-full border border-border px-4 py-1.5 text-[13.5px] text-cocoa-soft disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-cedar px-4 py-1.5 text-[13.5px] font-medium text-cream disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-border px-4 py-1.5 text-[13.5px] text-cocoa-soft"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-full border border-border px-4 py-1.5 text-[13.5px] text-cocoa hover:border-cedar"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
