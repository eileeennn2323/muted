export default function Loading() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-light tracking-tight text-cocoa">People</h1>
          <p className="mt-1.5 text-[15px] text-cocoa-soft">Everyone you keep notes on.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-border bg-paper p-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-border" />
            <div className="flex-1">
              <div className="h-3.5 w-28 rounded bg-border" />
              <div className="mt-2 h-3 w-64 rounded bg-border/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
