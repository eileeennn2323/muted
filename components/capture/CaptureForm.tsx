"use client";

import { useRef, useState } from "react";
import { LockIcon } from "@/components/people/icons";
import PickedUpResult, { type PickedUpData } from "./PickedUpResult";

type CaptureResponse = {
  pickedUp: PickedUpData | null;
  warning?: string;
  error?: string;
};

export default function CaptureForm({
  personId,
  onCaptured,
  onCancel,
}: {
  /** Scopes the capture to a specific person (Add note on a person page). */
  personId?: string;
  /** Called after a successful, analysed capture — used to refresh the playbook. */
  onCaptured?: () => void;
  /** Shows a Cancel action next to Submit — pass this when a caller controls
   * whether this form is mounted at all (e.g. a person page's Add note panel). */
  onCancel?: () => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CaptureResponse | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed, personId }),
      });
      const data = (await res.json()) as CaptureResponse;

      if (!res.ok) {
        setResult({ pickedUp: null, warning: data.error ?? "Something went wrong. Please try again." });
      } else {
        setResult(data);
        setNote("");
        onCaptured?.();
      }
    } catch {
      setResult({ pickedUp: null, warning: "Couldn't reach Muted. Check your connection and try again." });
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Dump what happened — Muted will figure out who it's about and what it means."
          rows={onCancel ? 5 : 10}
          disabled={submitting}
          autoFocus={!!onCancel}
          className="w-full resize-y rounded-xl border border-border bg-paper/40 p-5 text-base leading-relaxed text-cocoa placeholder:text-cocoa-soft/70 focus:border-cedar focus:outline-none disabled:opacity-70"
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="font-mono text-xs text-cocoa-soft/70">
            {submitting ? "Muted is reading this…" : " "}
          </p>
          <div className="flex items-center gap-3">
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-sm text-cocoa-faint hover:text-cocoa-soft">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!note.trim() || submitting}
              className="rounded-lg bg-cedar px-6 py-2.5 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Submit
            </button>
          </div>
        </div>
      </form>

      {!onCancel && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-cocoa-faint italic">
            e.g. &ldquo;gordon keeps saying &lsquo;exactly, you&rsquo;re absolutely right!&rsquo; then
            does the opposite two minutes later — hard to communicate with, doesn&rsquo;t take
            feedback.&rdquo;
          </p>
          <p className="flex items-center gap-1.5 text-sm text-cocoa-faint">
            <LockIcon className="h-3.5 w-3.5" /> Private to you — no one else can see this.
          </p>
        </div>
      )}

      <PickedUpResult pickedUp={result?.pickedUp ?? null} warning={result?.warning} />
    </div>
  );
}
