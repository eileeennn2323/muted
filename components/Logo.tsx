/** The Muted mark — 木 (tree) standing in for the "t" in "muted": a head,
 * a trunk, an arm-bar, and two legs/roots. Renders in `currentColor`. */
export default function Logo({ className, size = 26 }: { className?: string; size?: number }) {
  const height = size;
  const width = (size * 30) / 34;
  return (
    <svg width={width} height={height} viewBox="0 0 30 34" className={className} aria-hidden>
      <circle cx="15" cy="4.8" r="4.4" fill="currentColor" />
      <path
        d="M15 9.6 V33 M3 15.4 H27 M15 17.4 C11.4 22.6 8.2 26.6 4.4 30.8 M15 17.4 C18.6 22.6 21.8 26.6 25.6 30.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
