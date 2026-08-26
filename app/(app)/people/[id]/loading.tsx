export default function Loading() {
  return (
    <div>
      <div className="h-4 w-16 rounded bg-border/50" />

      <div className="mt-4 flex animate-pulse items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-border" />
        <div>
          <div className="h-6 w-40 rounded bg-border" />
          <div className="mt-2 h-3 w-24 rounded bg-border/70" />
        </div>
      </div>

      <div className="mt-6 h-16 animate-pulse rounded-2xl border border-border-warm bg-border/20" />

      <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border bg-paper" />
        ))}
      </div>

      <div className="mt-8 h-40 animate-pulse rounded-2xl border border-border bg-paper" />

      <div className="mt-8 h-[560px] animate-pulse rounded-2xl border border-border bg-paper" />
    </div>
  );
}
