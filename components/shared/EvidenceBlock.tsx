import type { EvidenceItem } from "@/lib/evidence";

export default function EvidenceBlock({
  confidence,
  isInferred,
  userEdited,
  evidence,
  onEdit,
  onDelete,
  deleting,
  error,
}: {
  confidence?: string | null;
  isInferred: boolean;
  userEdited: boolean;
  evidence: EvidenceItem[];
  onEdit?: () => void;
  onDelete: () => void;
  deleting: boolean;
  error: string | null;
}) {
  return (
    <div className="mt-1.5 pl-[17px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-cocoa-quiet">
        {isInferred && <span className="text-brass">Muted inferred</span>}
        {userEdited && <span className="text-cedar-dark">Edited by you</span>}
        {confidence && <span>{confidence} confidence</span>}
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-cedar-dark hover:text-cedar">
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="text-ochre hover:opacity-80 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {evidence.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-2.5">
          <p className="font-mono text-[10px] text-cocoa-quiet">
            Based on {evidence.length} note{evidence.length === 1 ? "" : "s"}
          </p>
          {evidence.map((e) => (
            <div key={e.noteId} className="border-l border-border pl-3.5">
              <p className="font-serif text-[13.5px] leading-relaxed text-cocoa-soft italic">&ldquo;{e.quote}&rdquo;</p>
              <p className="mt-1 font-mono text-[10px] text-cocoa-quiet">
                {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-ochre">{error}</p>}
    </div>
  );
}
