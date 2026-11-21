"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

const marks = [
  { id: "date", label: "19 Dec", hint: "Saturday, 19 December 2026", href: "/#date" },
  { id: "session-1000", label: "10:00", hint: "10:00 AM session", href: "/programme#session-1000" },
  { id: "session-1100", label: "11:00", hint: "11:00 AM session", href: "/programme#session-1100" },
  { id: "session-1200", label: "12:00", hint: "12:00 PM session", href: "/programme#session-1200" },
  { id: "session-0100", label: "01:00", hint: "01:00 PM session", href: "/programme#session-0100" },
  { id: "register", label: "Register", hint: "Reserve your seat", href: "/registration" },
  { id: "webex", label: "Webex", hint: "Join on Cisco Webex", href: "/join" },
  { id: "brochure", label: "Brochure", hint: "Download or WhatsApp the brochure", href: "/brochure" },
  { id: "rci", label: "RCI", hint: "RCI CRE approval is awaited", href: "/attend" },
] as const;

export function ScrollTicks() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [seen, setSeen] = useState<readonly string[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const scrolling = document.documentElement;
      const max = scrolling.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      const reached = marks.filter((mark) => {
        const target = document.getElementById(mark.id);
        return target !== null && target.getBoundingClientRect().top < window.innerHeight * 0.55;
      });
      setSeen(reached.map((mark) => mark.id));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <nav className="scroll-ticks no-print" aria-label="Important dates and links" style={{ "--tick-progress": `${progress * 100}%` } as CSSProperties}>
      <div className="scroll-ticks-track" aria-hidden="true">
        <span />
      </div>
      <ol>
        {marks.map((mark) => {
          const current = seen.includes(mark.id) || (!mark.href.includes("#") && pathname === mark.href);
          return (
            <li key={mark.id}>
              <Link href={mark.href} aria-current={current ? "true" : undefined} title={mark.hint}>
                <span className="tick-box" aria-hidden="true">
                  {current ? "✓" : ""}
                </span>
                <span className="tick-label">{mark.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
