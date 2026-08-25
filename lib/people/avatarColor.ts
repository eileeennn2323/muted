const AVATAR_PALETTE = [
  { bg: "bg-sage", text: "text-cedar-deep" },
  { bg: "bg-cedar", text: "text-cream" },
  { bg: "bg-brass-solid", text: "text-brass-ink" },
  { bg: "bg-ochre", text: "text-cream" },
  { bg: "bg-cedar-dark", text: "text-cream" },
] as const;

/** Deterministic per-name color so people stay visually distinguishable
 * across the People list and profile pages without real photos — same
 * name always lands on the same palette entry. */
export function avatarColorFor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}
