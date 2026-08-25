"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

export default function DeletePersonMenu({ personId, personName }: { personId: string; personName: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/people/${personId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/people");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete this person.");
    } catch {
      setError("Couldn't reach Muted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="More actions"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cocoa-faint transition-colors hover:bg-sand hover:text-cocoa-soft"
      >
        <KebabIcon />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-border bg-paper py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              className="w-full px-3.5 py-2 text-left text-[13.5px] text-ochre hover:bg-border-avoid"
            >
              Delete person
            </button>
          </div>
        </>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/25 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-paper p-6 shadow-2xl">
            <h2 className="font-serif text-xl font-light text-cocoa">Delete {personName}?</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">
              This will remove {personName}&rsquo;s profile and Muted&rsquo;s insights about them. This cannot be
              undone.
            </p>
            {error && <p className="mt-3 text-[13px] text-ochre">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="rounded-full border border-border px-4 py-2 text-[13.5px] text-cocoa-soft disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-ochre px-4 py-2 text-[13.5px] font-medium text-cream disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete person"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
