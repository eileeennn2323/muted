import AskMutedPanel from "@/components/ask/AskMutedPanel";

/** Direct-link fallback for /ask — the primary entry point is the Ask Muted
 * drawer (available from any page via the floating button), which renders
 * this same panel. */
export default function AskMutedPage() {
  return (
    <div className="h-[70vh] overflow-hidden rounded-2xl border border-border">
      <AskMutedPanel />
    </div>
  );
}
