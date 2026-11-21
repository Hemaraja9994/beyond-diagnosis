"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNav } from "@/lib/programme";

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 bg-navy/95 shadow-[0_-6px_24px_rgba(11,31,58,0.2)] backdrop-blur md:hidden"
      aria-label="Sections"
    >
      <ul className="grid grid-cols-5">
        {bottomNav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex h-16 items-center justify-center px-1 text-center font-display text-[0.8rem] font-medium uppercase tracking-[0.06em] ${active ? "text-gold" : "text-white/85"}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
