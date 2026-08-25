"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinUnlock() {
  const router = useRouter();
  const [digits, setDigits] = useState<string>("");
  const [verifying, setVerifying] = useState(false);

  function handleKey(key: string) {
    if (verifying) return;
    if (key === "") return;
    if (key === "⌫") {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (digits.length >= 4) return;

    const next = digits + key;
    setDigits(next);

    if (next.length === 4) {
      setVerifying(true);
      window.setTimeout(() => {
        window.localStorage.setItem("muted_unlocked", "true");
        router.replace("/");
      }, 600);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <p className="font-serif text-3xl font-light tracking-tight text-cocoa">Muted</p>
        <p className="mt-2 text-sm text-cocoa-soft">Enter your 4-digit PIN</p>
      </div>

      <div className="flex gap-3" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full border border-cocoa-soft ${
              i < digits.length ? "bg-cedar border-cedar" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      <p className="h-5 font-mono text-xs text-cedar-dark">
        {verifying ? "Verifying..." : " "}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key, i) => (
          <button
            key={`${key}-${i}`}
            type="button"
            disabled={key === "" || verifying}
            onClick={() => handleKey(key)}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-lg transition-colors ${
              key === ""
                ? "invisible"
                : "bg-paper text-cocoa hover:bg-border disabled:opacity-50"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <p className="font-mono text-xs text-cocoa-soft/70">
        Demo unlock — not real security
      </p>
    </div>
  );
}
