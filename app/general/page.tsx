import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { officialLinks, programme, sessions } from "@/lib/programme";

export const metadata: Metadata = { title: "Information" };

export default function GeneralPage() {
  return (
    <div className="pb-24 md:pb-0">
      <PageBanner
        kicker="General information"
        title="The Act, the guidelines, and the papers for the day"
        lede="Official texts stay on the government sites that publish them. The schedule, checklist, and certificate note below are handouts for this CRE only."
      />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-serif text-3xl text-navy">Official channels</h2>
        <ul className="mt-5 grid gap-3">
          {officialLinks.map((link) => (
            <li key={link.href} className="rounded-3xl bg-card p-5 ring-1 ring-line">
              <a className="font-semibold text-navy underline decoration-green underline-offset-4" href={link.href}>
                {link.title}
              </a>
              <p className="mt-2 leading-7 text-muted">{link.note}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 lg:grid-cols-3" id="downloads">
        <article className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-serif text-2xl text-navy">Schedule</h2>
          <ol className="mt-3 grid gap-2 text-sm leading-6">
            {sessions.map((session) => (
              <li key={session.crr}>
                {session.time} {session.meridiem} · {session.person}
              </li>
            ))}
          </ol>
          <a className="mt-4 inline-flex font-semibold text-green" href="/programme">
            Open the full programme
          </a>
        </article>
        <article className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-serif text-2xl text-navy">What to keep ready</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-6">
            <li>Your CRR number, written as it appears on the Central Rehabilitation Register.</li>
            <li>The name you want on the certificate.</li>
            <li>A quiet connection for the Webex session from 10:00 IST.</li>
            <li>The 2024 assessment guidelines, if you want them beside you during the sessions.</li>
          </ul>
          <p className="mt-3 text-sm text-muted">This checklist is a programme handout. It is not a government certificate form.</p>
        </article>
        <article className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-serif text-2xl text-navy">Certificate</h2>
          <p className="mt-3 leading-7 text-muted">
            {programme.organiser} issues the CRE certificate after the programme, under the norms that apply to {programme.acknowledgement}.
            Use the same name and CRR number at registration. The download steps will come from {programme.email}. This website does not generate certificates.
          </p>
        </article>
      </section>
    </div>
  );
}
