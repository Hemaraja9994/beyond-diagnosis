import type { Metadata } from "next";
import { Face } from "@/components/face";
import { PageBanner } from "@/components/page-banner";
import { facultyProfile, speakers } from "@/lib/programme";

export const metadata: Metadata = { title: "Faculty" };

export default function FacultyPage() {
  return (
    <div className="pb-20 md:pb-6">
      <PageBanner
        kicker="Faculty"
        title="Resource"
        accent="persons"
        lede="Four experienced clinicians and academics lead the sessions, from the Act as a whole to its application in everyday clinical practice."
      />
      <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-2">
        {speakers.map((session) => {
          const index = session.session - 1;
          const profile = facultyProfile(session.crr);
          return (
            <li key={session.crr} className={`card accent-${index + 1} overflow-hidden`}>
              <div className="h-2 bg-accent" />
              <div className="p-6">
                <div className="flex items-center gap-5">
                  <Face name={session.person} initials={session.initials} photo={session.photo} className="h-24 w-24 sm:h-28 sm:w-28" />
                  <div>
                    <h2 className="text-xl font-bold text-navy sm:text-2xl">{session.person}</h2>
                    {profile ? <p className="text-sm text-muted">{profile.fullName}</p> : null}
                    {session.designation ? <p className="mt-1 text-sm leading-6 text-ink">{session.designation}</p> : null}
                    {profile && !session.designation ? (
                      <p className="mt-1 text-sm leading-6 text-ink">
                        {profile.role}, {profile.affiliation}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted">CRR {session.crr}</p>
                  </div>
                </div>
                <p className="speaker-name text-accent mt-6 text-sm">
                  Session {index + 1} · {session.time} {session.meridiem} IST
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-snug text-ink">{session.title}</h3>
                <p className="mt-3 leading-7 text-muted">{session.relevance}</p>
                {profile ? (
                  <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    <a className="font-semibold text-green underline decoration-green underline-offset-4" href={profile.profileUrl}>
                      {profile.profileLabel}
                    </a>
                    {"scholarUrl" in profile ? (
                      <a className="font-semibold text-green underline decoration-green underline-offset-4" href={profile.scholarUrl}>
                        Google Scholar
                      </a>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
