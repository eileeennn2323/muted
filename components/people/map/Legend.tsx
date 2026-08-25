import { EDGE_KIND_LEGEND, EDGE_KIND_STYLES } from "./types";

export default function Legend() {
  return (
    <div className="flex flex-wrap gap-3 border-t border-border pt-3">
      {EDGE_KIND_LEGEND.map(({ kind, label }) => {
        const style = EDGE_KIND_STYLES[kind];
        return (
          <span key={kind} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[12px] text-cocoa-soft">
            <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden>
              <line
                x1="1"
                y1="4"
                x2="17"
                y2="4"
                stroke={style.stroke}
                strokeWidth="2"
                strokeDasharray={style.dash}
                strokeLinecap="round"
              />
            </svg>
            {label}
          </span>
        );
      })}
    </div>
  );
}
