"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnnouncementRail } from "@/components/announcement-rail";
import { nav, programme } from "@/lib/programme";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 shadow-[0_6px_24px_rgba(11,31,58,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/brand/yenepoya-medical-college.png"
            alt="Yenepoya Medical College"
            width={474}
            height={257}
            className="h-10 w-auto sm:h-12"
            priority
            unoptimized
          />
          <Image
            src="/brand/rci.png"
            alt={`Rehabilitation Council of India — programme approved, F. No. ${programme.rciFileNo}`}
            title={`Approved by RCI · F. No. ${programme.rciFileNo} · ${programme.rciHours} hours`}
            width={740}
            height={668}
            className="h-10 w-auto sm:h-12"
            priority
            unoptimized
          />
          <span className="min-w-0 border-l border-line pl-3 text-[0.7rem] leading-4 text-navy sm:text-xs sm:leading-5">
            <span className="block font-display text-[0.8rem] font-semibold uppercase tracking-[0.08em] sm:text-sm">{programme.organiser}</span>
            <span className="block text-muted">
              {programme.hospital} · {programme.university}
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 font-display text-[0.95rem] font-medium uppercase tracking-[0.06em] text-navy lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-green">
              {item.label}
            </Link>
          ))}
          <Link href={programme.registrationClosed ? "/registration/status" : "/registration"} className="pill pill-solid min-h-10 px-5 text-sm">
            {programme.registrationClosed ? "My registration" : "Register"}
          </Link>
        </nav>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border border-line text-navy lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="text-xl leading-none">
            {open ? "×" : "☰"}
          </span>
        </button>
      </div>
      {open ? (
        <nav id="mobile-menu" className="border-t border-line bg-card px-4 py-3 lg:hidden" aria-label="Mobile">
          <ul className="grid gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-2xl px-3 py-3 font-display text-lg uppercase tracking-[0.06em] text-navy"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={programme.registrationClosed ? "/registration/status" : "/registration"}
                className="pill pill-solid mt-2 flex w-full"
                onClick={() => setOpen(false)}
              >
                {programme.registrationClosed ? "My registration" : "Register"}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
      {programme.registrationClosed ? (
        <Link
          href="/registration/status"
          className="block bg-red-700 px-4 py-2 text-center text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-red-800 sm:text-base"
          role="status"
        >
          Registrations closed
          <span className="ml-2 font-semibold normal-case tracking-normal text-white/85">
            · the webinar link will reach registered participants · check your status ›
          </span>
        </Link>
      ) : null}
      <AnnouncementRail />
    </header>
  );
}
