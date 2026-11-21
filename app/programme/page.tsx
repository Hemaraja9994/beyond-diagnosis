import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { facultyProfile, programme, sessionTickId, sessions } from "@/lib/programme";

export const metadata: Metadata = { title: "Programme" };

export default function ProgrammePage() {
  return (
    <div className="pb-20 md:pb-0">
      <PageBanner
        kicker="Scientific programme"
        title="Four sessions, one Act"
        lede={`${programme.dateLabel}, from ${programme.start}. Online. Times are India Standard Time.`}
      />
      <ol className="timeline mx-auto grid max-w-3xl gap-6 px-4 py-10">
        {sessions.map((session) => {
          const profile = facultyProfile(session.crr);
          return (
            <li id={sessionTickId(session.time)} key={session.crr} className="grid gap-2 sm:grid-cols-[5.5rem_1fr] sm:gap-4">
              <p className="text-sm font-semibold text-green">
                {session.time}
                <span className="text-xs font-normal text-muted sm:block"> {session.meridiem} IST</span>
              </p>
              <article className="rounded-3xl bg-card p-4 ring-1 ring-line sm:p-5">
                <h2 className="font-serif text-xl leading-snug text-navy sm:text-2xl">{session.title}</h2>
                <p className="mt-3 font-semibold">
                  {session.person}
                  <span className="font-normal text-muted"> · CRR {session.crr}</span>
                </p>
                {profile ? (
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {profile.role}, {profile.affiliation}
                  </p>
                ) : null}
                <p className="mt-3 leading-7 text-muted">{session.relevance}</p>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
