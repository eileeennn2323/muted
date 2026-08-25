"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function AddPersonDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setName("");
    setError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create this person.");
        return;
      }
      close();
      router.push(`/people/${data.id}`);
    } catch {
      setError("Couldn't reach Muted.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-cedar px-4 py-2 text-[13.5px] font-medium text-cream transition-opacity hover:opacity-90"
      >
        <PlusIcon />
        Add person
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/25 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-paper p-6 shadow-2xl">
            <h2 className="font-serif text-xl font-light text-cocoa">Add a person</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">
              Create their profile, then paste notes about them to build it up.
            </p>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Their name"
                autoFocus
                disabled={saving}
                className="mt-4 w-full rounded-lg border border-border bg-cream px-3.5 py-2.5 text-[14px] text-cocoa outline-none focus:border-cedar disabled:opacity-70"
              />
              {error && <p className="mt-2 text-[13px] text-ochre">{error}</p>}
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={saving}
                  className="rounded-full border border-border px-4 py-2 text-[13.5px] text-cocoa-soft disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || saving}
                  className="rounded-full bg-cedar px-4 py-2 text-[13.5px] font-medium text-cream disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
