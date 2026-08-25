import type { ReactNode } from "react";

export default function FacetCard({
  title,
  icon,
  count,
  variant = "default",
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  variant?: "default" | "avoid";
  children: ReactNode;
}) {
  const borderClass = variant === "avoid" ? "border-border-avoid" : "border-border";
  const iconColorClass = variant === "avoid" ? "text-ochre" : "text-cedar";

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border ${borderClass} bg-paper p-5`}>
      <div className="flex items-center gap-2.5">
        <span className={iconColorClass}>{icon}</span>
        <p className="flex-1 text-[15px] text-cocoa">{title}</p>
        {count > 0 && <span className="font-mono text-[11px] text-cocoa-quiet">{count}</span>}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
