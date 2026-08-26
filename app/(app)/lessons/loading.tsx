export default function Loading() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-cocoa-soft">Lessons</p>
      <h1 className="mt-2 font-serif text-4xl font-light tracking-tight text-cocoa">Your playbook of lessons</h1>
      <p className="mt-4 max-w-lg text-cocoa-soft">Reusable, people-related wisdom, organised into four themes.</p>

      <div className="mt-10 flex flex-col gap-10">
        {["Communication", "Leadership", "Stakeholder Management", "Personal Growth"].map((theme) => (
          <section key={theme}>
            <div className="border-b border-border pb-3">
              <h2 className="font-serif text-xl font-light text-cocoa">{theme}</h2>
            </div>
            <div className="mt-4 flex animate-pulse flex-col gap-3">
              <div className="h-14 rounded-xl border border-border bg-paper" />
              <div className="h-14 rounded-xl border border-border bg-paper" />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
