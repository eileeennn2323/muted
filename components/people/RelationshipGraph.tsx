import Link from "next/link";
import type { PlaybookRelationship } from "@/lib/people/queries";
import { initialsFor } from "@/lib/people/format";

const MAX_SHOWN = 6;

function nodePosition(index: number, count: number): { x: number; y: number } {
  const angle = (-90 + (360 / count) * index) * (Math.PI / 180);
  const radius = 38;
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
}

/** Confidence reads as line weight/opacity rather than another label — the
 * fewer distinct visual signals, the easier this stays "simple", per the
 * masterplan's explicit steer away from a complex interactive network graph. */
function lineOpacity(confidence: string): number {
  if (confidence === "high") return 0.85;
  if (confidence === "medium") return 0.5;
  return 0.28;
}

export default function RelationshipGraph({
  personName,
  relationships,
}: {
  personName: string;
  relationships: PlaybookRelationship[];
}) {
  if (relationships.length === 0) return null;

  const shown = relationships.slice(0, MAX_SHOWN);
  const extra = relationships.length - shown.length;

  return (
    <div className="rounded-2xl border border-border bg-paper p-5">
      <div className="relative mx-auto aspect-square w-full max-w-[300px]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          {shown.map((r, i) => {
            const { x, y } = nodePosition(i, shown.length);
            return (
              <line
                key={r.id}
                x1="50"
                y1="50"
                x2={x}
                y2={y}
                stroke="var(--color-cedar)"
                strokeOpacity={lineOpacity(r.confidence)}
                strokeWidth={r.isInferred ? 1 : 1.5}
                strokeDasharray={r.isInferred ? "2 2.5" : undefined}
              />
            );
          })}
        </svg>

        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
          style={{ left: "50%", top: "50%" }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cedar font-serif text-base text-cream shadow-sm">
            {initialsFor(personName)}
          </div>
          <span className="max-w-[76px] truncate whitespace-nowrap font-mono text-[10px] text-cocoa-quiet">
            {personName}
          </span>
        </div>

        {shown.map((r, i) => {
          const { x, y } = nodePosition(i, shown.length);
          return (
            <Link
              key={r.id}
              href={`/people/${r.otherPersonId}`}
              title={r.content}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage font-serif text-xs text-cedar-deep ring-2 ring-paper transition-transform hover:scale-105">
                {initialsFor(r.otherPersonName)}
              </span>
              <span className="max-w-[72px] truncate text-center text-[11px] text-cocoa-soft">
                {r.otherPersonName}
              </span>
            </Link>
          );
        })}
      </div>

      {extra > 0 && <p className="mt-3 text-center font-mono text-[10px] text-cocoa-quiet">+{extra} more below</p>}
    </div>
  );
}
