"use client";

import { useState } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import type { MapNoteData } from "./types";

export type StickyNoteFlowNode = Node<
  MapNoteData & { onContentChange: (id: string, content: string) => void; onDelete: (id: string) => void },
  "note"
>;

export default function StickyNoteNode({ data, selected }: NodeProps<StickyNoteFlowNode>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.content);

  function commit() {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== data.content) data.onContentChange(data.id, trimmed);
    else setDraft(data.content);
  }

  return (
    <div
      className={`group relative rounded-md bg-brass-solid/90 p-3 shadow-sm transition-shadow ${
        selected ? "shadow-md ring-1 ring-brass" : ""
      }`}
      style={{ width: 160 }}
    >
      <button
        type="button"
        onClick={() => data.onDelete(data.id)}
        aria-label="Delete note"
        className="absolute top-1 right-1 hidden h-5 w-5 items-center justify-center rounded-full text-brass-ink/60 hover:bg-brass-ink/10 hover:text-brass-ink group-hover:flex"
      >
        ×
      </button>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          rows={3}
          className="w-full resize-none bg-transparent text-[13px] leading-snug text-brass-ink outline-none"
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          className="cursor-text text-[13px] leading-snug whitespace-pre-wrap text-brass-ink"
        >
          {data.content}
        </p>
      )}
    </div>
  );
}
