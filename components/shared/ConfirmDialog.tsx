"use client";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/25 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-paper p-6 shadow-2xl">
        <h2 className="font-serif text-xl font-light text-cocoa">{title}</h2>
        {description && <p className="mt-2 text-[13.5px] leading-relaxed text-cocoa-soft">{description}</p>}
        {error && <p className="mt-3 text-[13px] text-ochre">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-full border border-border px-4 py-2 text-[13.5px] text-cocoa-soft disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-full bg-ochre px-4 py-2 text-[13.5px] font-medium text-cream disabled:opacity-50"
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
