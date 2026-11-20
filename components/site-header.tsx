"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MarkRail } from "@/components/mark-rail";
import { nav, programme } from "@/lib/programme";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/brand/yenepoya-medical-college.png"
            alt="Yenepoya Medical College"
            width={474}
            height={257}
            className="h-12 w-auto"
            priority
            unoptimized
          />
          <span className="hidden min-w-0 sm:block">
            <span className="block font-serif text-base leading-tight text-navy">{programme.title}</span>
            <span className="mt-0.5 block text-xs text-muted">
              {programme.level} CRE · {programme.day} {programme.month}
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-semibold text-navy lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-green">
              {item.label}
            </Link>
          ))}
          <Link href="/registration" className="rounded-lg bg-navy px-4 py-2 text-white">
            Register
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
                  className="block rounded-2xl px-3 py-3 text-lg text-navy"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/registration"
                className="mt-1 block rounded-lg bg-navy px-4 py-3 text-center font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                Register
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
      <MarkRail />
    </header>
  );
}
