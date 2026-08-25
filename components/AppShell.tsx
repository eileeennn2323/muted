"use client";

import { useEffect, useState } from "react";
import Nav from "./Nav";
import AskMutedPanel from "./ask/AskMutedPanel";
import { TwinkleIcon } from "./people/icons";

/** Owns the Ask Muted open/close state so the drawer can genuinely push the
 * main content aside on desktop (a real flex sibling, not an overlay) while
 * falling back to a full-screen overlay on mobile, where there's no room to
 * push anything. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    if (!askOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAskOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [askOpen]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Nav />

      <main className="min-w-0 flex-1 px-4 pb-24 pt-8 md:px-10 md:pb-10 md:pt-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      {/* Desktop: a real flex sibling that widens/narrows, pushing `main` aside.
          Sticky + viewport-height so the drawer stays put — and only its own
          message list scrolls — instead of scrolling away with a tall page. */}
      <div
        className={`hidden shrink-0 overflow-hidden border-border transition-[width] duration-300 ease-out md:sticky md:top-0 md:block md:h-screen ${
          askOpen ? "md:w-[400px] md:border-l" : "md:w-0"
        }`}
      >
        <div className="h-full w-[400px]">
          <AskMutedPanel onClose={() => setAskOpen(false)} />
        </div>
      </div>

      {/* Mobile: no room to push, so it overlays instead. */}
      {askOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close Ask Muted"
            onClick={() => setAskOpen(false)}
            className="absolute inset-0 bg-cocoa/25"
          />
          <div className="absolute inset-0">
            <AskMutedPanel onClose={() => setAskOpen(false)} />
          </div>
        </div>
      )}

      {!askOpen && (
        <button
          type="button"
          onClick={() => setAskOpen(true)}
          aria-label="Ask Muted"
          title="Ask Muted"
          className="fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brass-solid text-brass-ink shadow-lg transition-transform hover:scale-105 md:right-7 md:bottom-7"
        >
          <TwinkleIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
