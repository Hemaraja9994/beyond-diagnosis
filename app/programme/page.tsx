import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { facultyProfile, programme, sessions } from "@/lib/programme";

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
            <li key={session.crr} className="grid grid-cols-[4.2rem_1fr] gap-4 sm:grid-cols-[5.5rem_1fr]">
              <p className="text-sm font-semibold text-green">
                {session.time}
                <span className="block text-xs text-muted">{session.meridiem} IST</span>
              </p>
              <article className="rounded-3xl bg-card p-5 ring-1 ring-line">
                <h2 className="font-serif text-2xl leading-snug text-navy">{session.title}</h2>
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
