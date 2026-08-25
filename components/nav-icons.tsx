type IconProps = { className?: string };

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5v-6h4v6" />
    </svg>
  );
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M2.8 19c.7-3 2.9-4.8 6.2-4.8s5.5 1.8 6.2 4.8" />
      <circle cx="17" cy="8" r="2.4" />
      <path d="M15.5 6c.9-.5 1.9-.5 2.8-.1M15.4 14.5c2.6.3 4.2 1.7 4.8 4" />
    </svg>
  );
}

export function LessonsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 6.2C10.3 4.9 8 4.3 4.5 4.3V18c3.5 0 5.8.6 7.5 1.9M12 6.2c1.7-1.3 4-1.9 7.5-1.9V18c-3.5 0-5.8.6-7.5 1.9M12 6.2v13.7" />
    </svg>
  );
}

export function MeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="8.3" r="3.6" />
      <path d="M5 19.5c1-4 3.5-6 7-6s6 2 7 6" />
    </svg>
  );
}
