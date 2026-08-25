import CaptureForm from "@/components/capture/CaptureForm";

export default function HomePage() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-cocoa-soft">Home</p>
      <h1 className="mt-2 font-serif text-4xl font-light tracking-tight text-cocoa">Capture</h1>
      <p className="mt-4 max-w-lg text-cocoa-soft">
        Your private second brain for people at work. Dump whatever happened — Muted
        will organise it.
      </p>

      <div className="mt-8">
        <CaptureForm />
      </div>
    </div>
  );
}
