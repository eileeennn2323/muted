type IconProps = { className?: string };

const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}

/** A solid, filled four-point sparkle/twinkle glyph — used for the Ask
 * Muted trigger specifically, distinct from the outlined compass-style
 * SparkleIcon used elsewhere (e.g. "Working with {name}"). */
export function TwinkleIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2c.5 4.2 1.9 7.6 10 10-8.1 2.4-9.5 5.8-10 10-.5-4.2-1.9-7.6-10-10 8.1-2.4 9.5-5.8 10-10Z" />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1.2 6 4 2.5-2.8 4-4 6-4 3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20Z" />
    </svg>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 1.8-2.4 3.5" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  );
}

export function SeedlingIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 21V11" />
      <path d="M12 12c0-3.5-2.5-6-7-6 0 4 2.5 6.5 7 6Z" />
      <path d="M12 10c0-4 2.8-6.5 7-6.5 0 4.3-2.8 7-7 6.5Z" />
    </svg>
  );
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="9" cy="9.5" r="3.3" />
      <circle cx="16.5" cy="10.8" r="2.6" />
      <path d="M3.3 20c0-3.3 2.5-6 5.7-6s5.7 2.7 5.7 6" />
      <path d="M14.3 15.3c2.2.4 4 2.3 4 4.7" />
    </svg>
  );
}

export function NoEntryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 12h12" />
    </svg>
  );
}
