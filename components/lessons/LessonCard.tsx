"use client";

import { useState } from "react";
import type { LessonItem } from "@/lib/lessons/queries";
import EvidenceBlock from "@/components/shared/EvidenceBlock";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${expanded ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function LessonCard({
  lesson,
  onDeleted,
}: {
  lesson: LessonItem;
  onDeleted: (id: string) => void;
}) {
  const [current, setCurrent] = useState(lesson);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(lesson.title);
  const [explanationDraft, setExplanationDraft] = useState(lesson.explanation ?? "");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (deleted) return null;

  async function handleSave() {
    const title = titleDraft.trim();
    if (!title || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, explanation: explanationDraft.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setCurrent((prev) => ({
        ...prev,
        title: data.lesson.title,
        explanation: data.lesson.explanation,
        isInferred: data.lesson.is_inferred,
        userEdited: data.lesson.user_edited,
      }));
      setEditing(false);
    } catch {
      setError("Couldn't reach Muted.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${current.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleted(true);
        onDeleted(current.id);
        return;
      }
      setError("Could not delete.");
    } catch {
      setError("Couldn't reach Muted.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-border bg-paper p-5">
        <input
          type="text"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-border bg-cream px-2.5 py-2 text-[14.5px] text-cocoa outline-none focus:border-cedar"
        />
        <textarea
          value={explanationDraft}
          onChange={(e) => setExplanationDraft(e.target.value)}
          rows={2}
          placeholder="Short explanation (optional)"
          className="mt-2 w-full resize-y rounded-lg border border-border bg-cream p-2.5 text-[13.5px] text-cocoa-body outline-none focus:border-cedar"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-cedar px-3 py-1.5 text-xs font-medium text-cream disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setTitleDraft(current.title);
              setExplanationDraft(current.explanation ?? "");
              setEditing(false);
              setError(null);
            }}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-cocoa-soft"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-ochre">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-paper p-5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[16px] leading-snug text-cocoa">
            {current.title}
            {current.isInferred && (
              <span
                aria-hidden
                title="Muted inferred"
                className="ml-1.5 inline-block h-[5px] w-[5px] rounded-full bg-brass align-middle"
              />
            )}
          </p>
          {current.explanation && (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-cocoa-soft">{current.explanation}</p>
          )}
          {current.relatedPeople.length > 0 && (
            <p className="mt-2 font-mono text-[10px] text-cocoa-quiet">
              With {current.relatedPeople.map((p) => p.name).join(", ")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Hide details" : "Show details"}
          aria-expanded={expanded}
          className={`-mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-cocoa-faint transition-colors hover:bg-sand hover:text-cocoa-soft ${
            expanded ? "bg-sand text-cocoa-soft" : ""
          }`}
        >
          <ChevronIcon expanded={expanded} />
        </button>
      </div>

      {expanded && (
        <EvidenceBlock
          isInferred={current.isInferred}
          userEdited={current.userEdited}
          evidence={current.evidence}
          onEdit={() => setEditing(true)}
          onDelete={() => setConfirmOpen(true)}
          deleting={deleting}
          error={error}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="Delete this lesson?"
          description="This removes it from your library. This cannot be undone."
          confirmLabel="Delete"
          pendingLabel="Deleting…"
          pending={deleting}
          error={error}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
