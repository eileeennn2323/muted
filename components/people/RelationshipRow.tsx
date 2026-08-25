"use client";

import Link from "next/link";
import { useState } from "react";
import type { PlaybookRelationship } from "@/lib/people/queries";
import { avatarColorFor } from "@/lib/people/avatarColor";
import { initialsFor } from "@/lib/people/format";
import EvidenceBlock from "@/components/shared/EvidenceBlock";

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

export default function RelationshipRow({
  relationship,
  onDeleted,
}: {
  relationship: PlaybookRelationship;
  onDeleted: (id: string) => void;
}) {
  const [item, setItem] = useState(relationship);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(relationship.content);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const color = avatarColorFor(item.otherPersonName);

  if (deleted) return null;

  async function handleSave() {
    const content = draft.trim();
    if (!content || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/relationship-insights/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setItem((prev) => ({
        ...prev,
        content: data.insight.content,
        confidence: data.insight.confidence,
        isInferred: data.insight.is_inferred,
        userEdited: data.insight.user_edited,
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
    if (!window.confirm("Delete this relationship insight?")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/relationship-insights/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleted(true);
        onDeleted(item.id);
        return;
      }
      setError("Could not delete.");
    } catch {
      setError("Couldn't reach Muted.");
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <li className="py-1.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
          className="w-full resize-y rounded-lg border border-border bg-cream p-2.5 text-[14px] text-cocoa-body outline-none focus:border-cedar"
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
              setDraft(item.content);
              setEditing(false);
              setError(null);
            }}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-cocoa-soft"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-ochre">{error}</p>}
      </li>
    );
  }

  return (
    <li className="py-1.5">
      <div className="flex items-start gap-2.5">
        <Link
          href={`/people/${item.otherPersonId}`}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-serif text-[11px] ${color.bg} ${color.text}`}
        >
          {initialsFor(item.otherPersonName)}
        </Link>
        <p className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-cocoa-body">
          <Link href={`/people/${item.otherPersonId}`} className="font-medium text-cocoa hover:underline">
            {item.otherPersonName}
          </Link>
          {" — "}
          {item.content}
          {item.isInferred && (
            <span
              aria-hidden
              title="Muted inferred"
              className="ml-1.5 inline-block h-[5px] w-[5px] rounded-full bg-brass align-middle"
            />
          )}
        </p>
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
          confidence={item.confidence}
          isInferred={item.isInferred}
          userEdited={item.userEdited}
          evidence={item.evidence}
          onEdit={() => setEditing(true)}
          onDelete={handleDelete}
          deleting={deleting}
          error={error}
        />
      )}
    </li>
  );
}
