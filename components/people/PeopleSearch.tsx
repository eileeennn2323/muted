"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PersonListItem } from "@/lib/people/queries";
import { avatarColorForRole } from "@/lib/people/avatarColor";
import { initialsFor } from "@/lib/people/format";
import { RELATIONSHIP_ROLES } from "@/lib/people/roles";

const TABS = ["All", ...RELATIONSHIP_ROLES] as const;

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0 text-chevron"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function PeopleSearch({ people }: { people: PersonListItem[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");

  const filtered = useMemo(() => {
    const byTab = tab === "All" ? people : people.filter((p) => p.roles[0] === tab);
    const q = query.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter(
      (p) => p.name.toLowerCase().includes(q) || p.roles.some((r) => r.toLowerCase().includes(q))
    );
  }, [people, query, tab]);

  return (
    <div>
      <div className="flex h-11 items-center gap-2.5 rounded-full bg-sand px-4">
        <span className="text-cocoa-faint">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          className="flex-1 bg-transparent text-sm text-cocoa outline-none placeholder:text-cocoa-faint"
        />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-[13.5px] whitespace-nowrap transition-colors ${
              tab === t
                ? "border-cedar bg-cedar text-cream"
                : "border-border text-cocoa-soft hover:border-cocoa-quiet hover:text-cocoa"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {people.length === 0 ? (
        <p className="mt-10 font-serif text-lg text-cocoa-faint">
          No one yet — capture a note that mentions someone and they&rsquo;ll show up here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 font-serif text-lg text-cocoa-faint">
          {query.trim() ? "Nobody here by that name." : `No one tagged "${tab}" yet.`}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {filtered.map((p) => {
            const color = avatarColorForRole(p.roles[0] ?? null);
            return (
              <li key={p.id}>
                <Link
                  href={`/people/${p.id}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-border bg-paper px-5 py-4 transition-colors hover:border-cocoa-quiet hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-base ${color.bg} ${color.text}`}
                    >
                      {initialsFor(p.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15.5px] text-cocoa">{p.name}</p>
                      {p.roles.length > 0 && (
                        <span className="mt-0.5 inline-block rounded-full bg-sand px-2 py-0.5 font-mono text-[10px] tracking-wide text-cocoa-soft uppercase">
                          {p.roles[0]}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10.5px] whitespace-nowrap text-cocoa-quiet">
                      {p.insightCount > 0 ? `${p.insightCount} insight${p.insightCount === 1 ? "" : "s"}` : "New"}
                    </span>
                    <ChevronIcon />
                  </div>
                  {p.headline && (
                    <p className="truncate pl-[56px] text-[13.5px] text-cocoa-soft">{p.headline}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
