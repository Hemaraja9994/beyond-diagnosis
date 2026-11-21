import type { Metadata } from "next";
import Link from "next/link";
import { Face } from "@/components/face";
import { PageBanner } from "@/components/page-banner";
import { facultyProfile, programme, sessionTickId, sessions } from "@/lib/programme";

export const metadata: Metadata = { title: "Programme" };

export default function ProgrammePage() {
  return (
    <div className="pb-20 md:pb-6">
      <PageBanner
        kicker="Scientific programme"
        title="Four sessions,"
        accent="one Act"
        lede={`${programme.dateLabel}, from ${programme.start}. Online on Cisco Webex. All times are India Standard Time.`}
      />
      <ol className="mx-auto grid max-w-5xl gap-5 px-4 py-12">
        {sessions.map((session, index) => {
          const profile = facultyProfile(session.crr);
          return (
            <li id={sessionTickId(session.time)} key={session.crr} className={`session-card accent-${index + 1}`}>
              <div className="session-tab">
                <b>{session.time}</b>
                <span>{session.meridiem}</span>
                <small>Session {index + 1}</small>
              </div>
              <div className="session-body grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h2 className="text-xl font-bold leading-snug text-ink sm:text-2xl">{session.title}</h2>
                  <p className="speaker-name text-accent mt-3">{session.person}</p>
                  <p className="text-sm leading-6 text-muted">
                    {session.designation || (profile ? `${profile.role}, ${profile.affiliation}` : "")}
                    {session.designation || profile ? " · " : ""}CRR {session.crr}
                  </p>
                  <p className="mt-3 leading-7 text-muted">{session.relevance}</p>
                </div>
                <Face
                  name={session.person}
                  initials={session.initials}
                  photo={session.photo}
                  accent={index + 1}
                  className="order-first h-24 w-24 sm:order-none sm:h-32 sm:w-32"
                />
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mx-auto flex max-w-5xl flex-wrap gap-3 px-4">
        <Link href="/registration" className="pill pill-solid">
          Register today
        </Link>
        <Link href="/faculty" className="pill pill-outline">
          Meet the speakers
        </Link>
      </div>
    </div>
  );
}
