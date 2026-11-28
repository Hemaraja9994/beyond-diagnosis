import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/page-banner";
import { RegisterForm } from "@/components/register-form";
import { onlineAudience, onlineProgramme, programme, sessions } from "@/lib/programme";
import { onlineRegistrationOpen } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Non-RCI CRE registration",
  description: `Register for the regular online programme of ${programme.title} on ${programme.dateLabel}: open to ASLP students, professionals not registered with RCI, allied professionals, parents and caregivers. ${onlineProgramme.noCreLine}`,
};
export const dynamic = "force-dynamic";

/** The regular online programme: a separate registration page for people not claiming RCI CRE points. */
export default async function OnlineProgrammePage() {
  const open = await onlineRegistrationOpen().catch(() => false);

  return (
    <div id="register" className="pb-24 md:pb-10">
      <PageBanner
        kicker={`Non-RCI CRE registration · ${onlineProgramme.name}`}
        title={open ? "Join the" : "Online programme"}
        accent={open ? "online programme" : "registration closed"}
        lede={
          open
            ? `For ASLP students, professionals not registered with RCI, allied professionals, parents and caregivers. The same four live sessions on ${programme.dateLabel}, ${programme.start}, on Cisco Webex. Pay ${programme.feeLabel} on Razorpay, then register below. Open until ${onlineProgramme.closesLabel}.`
            : `Registration for the ${onlineProgramme.shortName.toLowerCase()} has closed. Registered participants will receive the webinar link.`
        }
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_18rem] lg:items-start">
        {open ? (
          <RegisterForm source="online" track="online" />
        ) : (
          <section className="card p-6">
            <h2 className="font-display text-2xl text-navy">Registration is closed</h2>
            <p className="mt-2 leading-7 text-muted">
              Registration for the {onlineProgramme.shortName.toLowerCase()} closed on {onlineProgramme.closesLabel}. Already registered? Check your status and
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
