"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { HomeIcon, LessonsIcon, MeIcon, PeopleIcon } from "./nav-icons";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/people", label: "People", Icon: PeopleIcon },
  { href: "/lessons", label: "Lessons", Icon: LessonsIcon },
  { href: "/me", label: "Me", Icon: MeIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop / tablet: compact icon-led rail */}
      <nav className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[84px] md:shrink-0 md:flex-col md:items-center md:gap-8 md:self-start md:overflow-y-auto md:border-r md:border-border md:bg-sand md:py-7">
        <Link href="/" className="text-cedar transition-opacity hover:opacity-75">
          <Logo size={28} />
        </Link>

        <ul className="flex flex-col items-center gap-5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className="flex flex-col items-center gap-1.5 transition-opacity hover:opacity-75">
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full ${active ? "bg-sage" : ""}`}
                  >
                    <item.Icon className={active ? "text-cedar" : "text-cocoa-soft"} />
                  </span>
                  <span className={`text-[11px] ${active ? "text-cedar" : "text-cocoa-soft"}`}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: fixed bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-cream md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                active ? "text-cedar" : "text-cocoa-soft"
              }`}
            >
              <item.Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
