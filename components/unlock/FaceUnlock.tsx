"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FaceUnlock() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);

  function handleScan() {
    if (scanning) return;
    setScanning(true);
    window.setTimeout(() => {
      window.localStorage.setItem("muted_unlocked", "true");
      router.replace("/");
    }, 1200);
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <p className="font-serif text-3xl font-light tracking-tight text-cocoa">Muted</p>
        <p className="mt-2 text-sm text-cocoa-soft">
          {scanning ? "Recognising..." : "Look at your camera to unlock"}
        </p>
      </div>

      <button
        type="button"
        onClick={handleScan}
        disabled={scanning}
        className="relative flex h-40 w-40 items-center justify-center rounded-full border-2 border-dashed border-cocoa-soft/50"
      >
        <span
          className={`absolute inset-0 rounded-full border-2 border-cedar ${
            scanning ? "animate-ping" : "opacity-0"
          }`}
          aria-hidden
        />
        <span className="flex h-28 w-28 items-center justify-center rounded-full bg-paper">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-cocoa-soft"
            aria-hidden
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
          </svg>
        </span>
      </button>

      <p className="text-xs text-cocoa-soft">
        {scanning ? " " : "Tap the frame to simulate a scan"}
      </p>

      <p className="font-mono text-xs text-cocoa-soft/70">
        Demo unlock — not real security
      </p>
    </div>
  );
}
