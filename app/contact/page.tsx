import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/page-banner";
import { QueryForm } from "@/components/query-form";
import { departmentUrl } from "@/lib/department";
import { committee, programme } from "@/lib/programme";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Support"
        title="Write to the"
        accent="organisers"
        lede="Questions about registration, payment, certificates or the sessions? Write to us and the organising team will reply by email."
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="hero-dark rounded-[1.75rem] p-6">
          <h2 className="font-display text-2xl sm:text-3xl">Programme desk</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6">
            {committee.map((seat) => (
              <li key={seat.role}>
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-mint">{seat.role}</span>
                {seat.names.map((name) => (
                  <span key={name} className="block">
                    {name}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <a className="underline" href={`mailto:${programme.email}`}>
              {programme.email}
            </a>
          </p>
          <a className="pill pill-solid mt-5" href={programme.whatsappUrl} target="_blank" rel="noopener noreferrer">
            Join the participants&apos; WhatsApp group
          </a>
          <p className="mt-6 text-sm leading-6 text-mint">
            Department line, published by Yenepoya Medical College: {programme.departmentPhone}. Department email: {programme.departmentEmail}.
            This is the department number, not a separate CRE helpline.
          </p>
          <p className="mt-4 text-sm leading-6 text-mint">{programme.address}</p>
          <p className="mt-4 text-sm">
            <Link className="underline" href="/department">
              Department and staff
            </Link>
            <span className="mx-2">·</span>
            <a className="underline" href={departmentUrl}>
              College page
            </a>
          </p>
        </aside>
        <QueryForm />
      </div>
    </div>
  );
}
