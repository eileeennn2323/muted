"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

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
        <ConfirmDialog
          title={`Delete ${personName}?`}
          description={`This will remove ${personName}’s profile and Muted’s insights about them. This cannot be undone.`}
          confirmLabel="Delete person"
          pendingLabel="Deleting…"
          pending={deleting}
          error={error}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
