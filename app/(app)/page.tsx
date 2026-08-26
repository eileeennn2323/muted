import CaptureForm from "@/components/capture/CaptureForm";

export default function HomePage() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-cocoa-soft">Home</p>
      <h1 className="mt-2 font-serif text-4xl font-light tracking-tight text-cocoa">Capture</h1>
      <p className="mt-4 max-w-lg text-cocoa-soft">Your private second brain for people at work.</p>

      <p className="mt-6 font-mono text-xs uppercase tracking-wide text-cocoa-soft">
        Learn · Predict · Strategise
      </p>
      <p className="mt-2 max-w-lg text-cocoa-soft">
        Write what you notice — Muted turns it into a playbook: what they care about,
        how to work with them, what to expect next time.
      </p>

      <div className="mt-8">
        <CaptureForm />
      </div>
    </div>
  );
}
