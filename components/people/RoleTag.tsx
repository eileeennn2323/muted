"use client";

import { useState } from "react";
import { RELATIONSHIP_ROLES } from "@/lib/people/roles";

export default function RoleTag({ personId, initialRole }: { personId: string; initialRole: string | null }) {
  const [role, setRole] = useState(initialRole);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    const previous = role;
    setRole(value);
    setSaving(true);
    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: value }),
      });
      if (!res.ok) setRole(previous);
    } catch {
      setRole(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={role ?? ""}
      onChange={handleChange}
      disabled={saving}
      className="rounded-full border border-border bg-sand px-2.5 py-1 font-mono text-[10.5px] tracking-wide text-cocoa-soft uppercase outline-none disabled:opacity-60"
    >
      <option value="">Add relationship</option>
      {RELATIONSHIP_ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
