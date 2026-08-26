"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error in (app):", error);
  }, [error]);

  return (
    <div>
      <h1 className="font-serif text-4xl font-light tracking-tight text-cocoa">Something went wrong</h1>
      <p className="mt-4 text-cocoa-soft">
        That page hit an unexpected error. It&rsquo;s usually temporary.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-cedar px-6 py-2.5 text-sm font-medium text-cream transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
