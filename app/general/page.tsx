import type { Metadata } from "next";
import { OfficialMarks } from "@/components/official-marks";
import { CreSteps } from "@/components/cre-steps";
import { PageBanner } from "@/components/page-banner";
import { officialLinks, programme, sessions } from "@/lib/programme";

export const metadata: Metadata = { title: "Information" };

export default function GeneralPage() {
  return (
    <div className="pb-24 md:pb-0">
      <PageBanner
        kicker="General information"
        title="Resources"
        accent="for the day"
        lede="Links to the official RPwD Act and assessment guidelines, a checklist for the day, and certificate information."
      />
      <OfficialMarks />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-2xl sm:text-3xl text-navy">Official channels</h2>
        <ul className="mt-5 grid gap-3">
          {officialLinks.map((link) => (
            <li key={link.href} className="card p-5">
              <a className="font-semibold text-navy underline decoration-green underline-offset-4" href={link.href}>
                {link.title}
              </a>
              <p className="mt-2 leading-7 text-muted">{link.note}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <CreSteps />
      </div>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-10 lg:grid-cols-3" id="downloads">
        <article className="card p-5">
          <h2 className="font-display text-2xl text-navy">Schedule</h2>
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
        <article className="card p-5">
          <h2 className="font-display text-2xl text-navy">What to keep ready</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-6">
            <li>Your CRR number, written as it appears on the Central Rehabilitation Register.</li>
            <li>The name you want on the certificate.</li>
            <li>A quiet connection for the Webex session from 10:00 IST, with your Webex display name the same as your registered name.</li>
            <li>Slido opens inside Webex for questions and polls — no separate download.</li>
            <li>The 2024 assessment guidelines, if you want them beside you during the sessions.</li>
          </ul>
        </article>
        <article className="card p-5">
          <h2 className="font-display text-2xl text-navy">Certificate</h2>
          <p className="mt-3 leading-7 text-muted">
            The Rehabilitation Council of India has approved this programme (F. No. {programme.rciFileNo}, {programme.rciHours} hours). The {programme.organiser} will issue certificates after the programme. Please register with the same name and CRR number you want on the certificate. Instructions will be emailed from {programme.email}.
          </p>
        </article>
      </section>
    </div>
  );
}
