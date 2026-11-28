import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/page-banner";
import { RegisterForm } from "@/components/register-form";
import { onlineAudience, onlineProgramme, programme, sessions } from "@/lib/programme";
import { onlineSeatsLeft } from "@/lib/seats";
import { onlineRegistrationOpen } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Participant registration",
  description: `Participant registration for ${programme.title} on ${programme.dateLabel}: offline hands-on at YMC for Yenepoya colleges. ${onlineProgramme.seats} seats, until ${onlineProgramme.closesLabel}. ${onlineProgramme.noCreLine}`,
};
export const dynamic = "force-dynamic";

/** The Non-RCI CRE programme: a separate registration page for people not claiming RCI CRE points. */
export default async function OnlineProgrammePage() {
  const switchOpen = await onlineRegistrationOpen().catch(() => false);
  const seatsLeft = switchOpen ? await onlineSeatsLeft().catch(() => onlineProgramme.seats) : 0;
  const full = switchOpen && seatsLeft <= 0;
  const open = switchOpen && !full;

  return (
    <div id="register" className="pb-24 md:pb-10">
      <PageBanner
        kicker="Participant registration · attend without CRE points"
        title={open ? "Offline hands-on" : "Participant registration"}
        accent={open ? "at YMC" : full ? "seats full" : "registration closed"}
        lede={
          open
            ? `${onlineProgramme.reasonLine} The same four sessions on ${programme.dateLabel}, from ${programme.start}, at the ${onlineProgramme.venue}. ${onlineProgramme.hallLine} Pay ${programme.feeLabel} on Razorpay, then register below. ${seatsLeft} of ${onlineProgramme.seats} seats left · open until ${onlineProgramme.closesLabel}.`
            : full
              ? `All ${onlineProgramme.seats} participant seats are taken. Registered participants will receive the details for the day.`
              : `Participant registration has closed. Registered participants will receive the details for the day.`
        }
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_18rem] lg:items-start">
        {open ? (
          <RegisterForm source="online" track="online" />
        ) : (
          <section className="card p-6">
            <h2 className="font-display text-2xl text-navy">Registration is closed</h2>
            <p className="mt-2 leading-7 text-muted">
              {full
                ? `All ${onlineProgramme.seats} seats are taken.`
                : `Participant registration closed on ${onlineProgramme.closesLabel}.`}{" "}
              Already registered? Check your status and
              download your acknowledgement on the{" "}
              <Link className="font-semibold text-green underline" href="/registration/status">
                status page
              </Link>
              . For anything else, write to {programme.email}.
            </p>
          </section>
        )}
        <aside className="grid h-fit gap-5 lg:sticky lg:top-32">
          <div className="info-card accent-1">
            <h2>Who can join</h2>
            <div>
              <ul className="grid gap-2 text-sm leading-6">
                {onlineAudience.map((item) => (
                  <li key={item} className="grid grid-cols-[1.25rem_1fr] gap-2">
                    <span aria-hidden="true" className="font-bold text-green">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-2xl bg-navy/5 px-3 py-2 text-sm font-semibold leading-6 text-navy">{onlineProgramme.noCreLine}</p>
              <p className="mt-2 text-sm leading-6 text-navy">
                <strong>{onlineProgramme.seats} seats</strong> in the hall · last date {onlineProgramme.closesLabel}.
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">Venue: {onlineProgramme.venue}. {onlineProgramme.hallLine}</p>
              <p className="mt-2 text-xs leading-5 text-muted">Participants receive an e-certificate of participation after the programme.</p>
            </div>
          </div>
          <div className="info-card accent-2">
            <h2>The day</h2>
            <div>
              <ol className="grid gap-3 text-sm leading-6">
                {sessions.map((session) => (
                  <li key={session.time} className="grid grid-cols-[4.5rem_1fr] gap-2">
                    <span className="font-semibold text-navy">
                      {session.time} {session.meridiem}
                    </span>
                    <span>
                      <span className="block">{session.person}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <a className="pill pill-solid mt-5 w-full" href={onlineProgramme.brochurePdf} target="_blank" rel="noopener noreferrer">
                Download the brochure
              </a>
              <Link className="mt-3 block text-center text-sm font-semibold text-green underline" href="/registration/status">
                Already registered? My status
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
