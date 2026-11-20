import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { Portrait } from "@/components/portrait";
import { facultyProfile, sessions } from "@/lib/programme";

export const metadata: Metadata = { title: "Faculty" };

export default function FacultyPage() {
  return (
    <div className="pb-20 md:pb-0">
      <PageBanner
        kicker="Resource persons"
        title="Who is teaching"
        lede="Names and CRR numbers are those given for this programme. Portraits are shown for Dr. Shwetha Prabhu, Ms. Swathi C, Vasudha K G, and Dr. Goswami."
      />
      <ul className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2">
        {sessions.map((session) => {
          const profile = facultyProfile(session.crr);
          return (
            <li key={session.crr} className="rounded-3xl bg-card p-5 ring-1 ring-line">
              <div className="flex gap-4">
                <Portrait
                  name={session.person}
                  initials={session.initials}
                  photo={session.photo}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl text-2xl"
                />
                <div>
                  <h2 className="font-serif text-2xl text-navy">{session.person}</h2>
                  {profile ? <p className="text-sm text-muted">{profile.fullName}</p> : null}
                  <p className="text-sm text-muted">CRR {session.crr}</p>
                  <p className="mt-1 text-sm font-semibold text-green">
                    {session.time} {session.meridiem} IST
                  </p>
                </div>
              </div>
              {profile ? (
                <p className="mt-4 text-sm leading-6">
                  <span className="font-semibold text-navy">{profile.role}</span>
                  <span className="text-muted">, {profile.affiliation}.</span>
                </p>
              ) : null}
              <h3 className="mt-4 font-serif text-lg leading-snug text-ink">{session.title}</h3>
              <p className="mt-3 leading-7 text-muted">{session.relevance}</p>
              {profile ? <p className="mt-3 leading-7 text-muted">{profile.focus}</p> : null}
              {profile ? (
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  <a
                    className="font-semibold text-green underline decoration-green underline-offset-4"
                    href={profile.profileUrl}
                  >
                    {profile.profileLabel}
                  </a>
                  {"scholarUrl" in profile ? (
                    <a
                      className="font-semibold text-green underline decoration-green underline-offset-4"
                      href={profile.scholarUrl}
                    >
                      Google Scholar
                    </a>
                  ) : null}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
