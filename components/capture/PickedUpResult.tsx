import Link from "next/link";

export type PickedUpData = {
  newPeople: { id: string; name: string }[];
  personLines: { personId: string; personName: string; content: string; isInferred: boolean }[];
  relationshipLines: {
    personAName: string;
    personBName: string;
    content: string;
    isInferred: boolean;
    confidence: string;
  }[];
  lessonLines: { content: string; isInferred: boolean }[];
  selfLine: { content: string; isInferred: boolean } | null;
};

function InferredTag() {
  return (
    <span className="ml-2 rounded-full bg-brass/15 px-2 py-0.5 font-mono text-[10px] tracking-wide text-brass uppercase">
      Muted inferred
    </span>
  );
}

export default function PickedUpResult({
  pickedUp,
  warning,
  currentPersonId,
}: {
  pickedUp: PickedUpData | null;
  warning?: string;
  /** The person whose page this form lives on, if any — "View profile" is
   * pointless (and just clutter) for a line about this exact person, since
   * the section below already updates in place. Still shown for anyone
   * else the note mentions. */
  currentPersonId?: string;
}) {
  if (warning) {
    return (
      <div className="mt-8 rounded-xl border border-ochre/30 bg-ochre/5 p-5">
        <p className="text-sm text-cocoa">{warning}</p>
      </div>
    );
  }

  if (!pickedUp) return null;

  const hasContent =
    pickedUp.newPeople.length > 0 ||
    pickedUp.personLines.length > 0 ||
    pickedUp.relationshipLines.length > 0 ||
    pickedUp.lessonLines.length > 0 ||
    pickedUp.selfLine;

  return (
    <div className="mt-8 rounded-2xl border border-border-warm bg-cream-highlight p-5">
      <p className="font-mono text-xs tracking-wide text-brass uppercase">Picked up</p>

      {!hasContent && <p className="mt-3 text-sm text-cocoa-soft">Nothing new to add from this note.</p>}

      <div className="mt-4 space-y-3">
        {pickedUp.newPeople.length > 0 && (
          <p className="text-sm text-cocoa-soft">
            <span className="font-medium text-cocoa">New: </span>
            {pickedUp.newPeople.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ", "}
                {p.name}
                {p.id !== currentPersonId && !pickedUp.personLines.some((line) => line.personId === p.id) && (
                  <>
                    {" "}
                    <Link href={`/people/${p.id}`} className="whitespace-nowrap text-cedar-dark hover:underline">
                      View profile →
                    </Link>
                  </>
                )}
              </span>
            ))}
          </p>
        )}

        {pickedUp.personLines.map((line) => (
          <p key={line.personId} className="text-sm text-cocoa-body">
            <span className="font-medium text-cocoa">{line.personName}</span>
            {" — "}
            {line.content}
            {line.isInferred && <InferredTag />}
            {line.personId !== currentPersonId && (
              <>
                {" "}
                <Link href={`/people/${line.personId}`} className="whitespace-nowrap text-cedar-dark hover:underline">
                  View profile →
                </Link>
              </>
            )}
          </p>
        ))}

        {pickedUp.relationshipLines.map((line, i) => (
          <p key={`${line.personAName}-${line.personBName}-${i}`} className="text-sm text-cocoa-body">
            <span className="font-medium text-cocoa">
              {line.personAName} ↔ {line.personBName}
            </span>
            {" — "}
            {line.content}
            {line.isInferred && <InferredTag />}
          </p>
        ))}

        {pickedUp.lessonLines.map((line, i) => (
          <p key={`lesson-${i}`} className="text-sm text-cocoa-body">
            <span className="font-medium text-cocoa">Lesson</span>
            {" — "}
            {line.content}
            {line.isInferred && <InferredTag />}
          </p>
        ))}

        {pickedUp.selfLine && (
          <p className="text-sm text-cocoa-body">
            <span className="font-medium text-cocoa">About you</span>
            {" — "}
            {pickedUp.selfLine.content}
            {pickedUp.selfLine.isInferred && <InferredTag />}
          </p>
        )}
      </div>
    </div>
  );
}
