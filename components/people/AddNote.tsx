"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import CaptureForm from "@/components/capture/CaptureForm";

const AddNoteContext = createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

function useAddNote() {
  const ctx = useContext(AddNoteContext);
  if (!ctx) throw new Error("AddNoteTriggerButton/AddNoteFormPanel must be used within AddNoteProvider");
  return ctx;
}

export function AddNoteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <AddNoteContext.Provider value={{ open, setOpen }}>{children}</AddNoteContext.Provider>;
}

function DocPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9.5 13.5h5M12 11v5" />
    </svg>
  );
}

/** Positioned to match the reference: a pill button sitting inline with the
 * person's name/role, right-aligned. Hides itself once the form is open. */
export function AddNoteTriggerButton() {
  const { open, setOpen } = useAddNote();
  if (open) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex shrink-0 items-center gap-2 rounded-full bg-sand px-4 py-2.5 text-[13.5px] text-cocoa transition-colors hover:bg-border"
    >
      <DocPlusIcon />
      Add note
    </button>
  );
}

export function AddNoteFormPanel({ personId }: { personId: string }) {
  const { open, setOpen } = useAddNote();
  const router = useRouter();
  if (!open) return null;

  return (
    <div className="mt-5">
      <CaptureForm personId={personId} onCaptured={() => router.refresh()} onCancel={() => setOpen(false)} />
    </div>
  );
}
