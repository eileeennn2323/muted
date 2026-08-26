export default function Loading() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-cocoa-soft">Me</p>
      <h1 className="mt-2 font-serif text-4xl font-light tracking-tight text-cocoa">About you</h1>
      <p className="mt-4 max-w-lg text-cocoa-soft">
        A working understanding of your own habits — not a personality test.
      </p>

      <div className="mt-8 grid animate-pulse gap-4 sm:grid-cols-2">
        {["Patterns", "Strengths", "Watch Outs", "Working On"].map((title) => (
          <div key={title} className="rounded-2xl border border-border bg-paper p-6">
            <p className="font-serif text-lg font-light text-cocoa">{title}</p>
            <div className="mt-3 h-14 rounded-lg bg-border/30" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-xl font-light text-cocoa">Relevant lessons</h2>
        <p className="mt-1 text-[13.5px] text-cocoa-soft">Lessons repeatedly connected to your own behaviour.</p>
        <div className="mt-4 h-14 animate-pulse rounded-xl border border-border bg-paper" />
      </div>
    </div>
  );
}
