const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  Peer: { bg: "bg-sage", text: "text-cedar-deep" },
  "Direct boss": { bg: "bg-cedar", text: "text-cream" },
  "Upper management": { bg: "bg-cedar-dark", text: "text-cream" },
  Stakeholder: { bg: "bg-brass-solid", text: "text-brass-ink" },
  Subordinate: { bg: "bg-cocoa-quiet", text: "text-cocoa" },
  Vendor: { bg: "bg-brass", text: "text-cream" },
  Other: { bg: "bg-cocoa-faint", text: "text-cream" },
};

const NO_ROLE_COLOR = { bg: "bg-sand", text: "text-cocoa-soft" };

/** One fixed colour per relationship-to-you tag (not per person) — the
 * avatar colour is a deliberate signal of how someone relates to you, not
 * decoration, so it must stay stable rather than vary by name. */
export function avatarColorForRole(role: string | null): { bg: string; text: string } {
  if (!role) return NO_ROLE_COLOR;
  return ROLE_COLORS[role] ?? NO_ROLE_COLOR;
}
