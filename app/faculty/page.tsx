import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { sessions } from "@/lib/programme";

export const metadata: Metadata = { title: "Faculty" };

export default function FacultyPage() {
  return (
    <div className="pb-20 md:pb-0">
      <PageBanner
        kicker="Resource persons"
        title="Who is teaching"
        lede="Names and CRR numbers are those given for this programme. Portraits will be added when the department has a consented photograph for each person."
      />
      <ul className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2">
        {sessions.map((session) => (
          <li key={session.crr} className="rounded-3xl bg-card p-5 ring-1 ring-line">
            <div className="flex gap-4">
              <div
                className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-navy font-serif text-2xl text-mint"
                role="img"
                aria-label={`Photograph of ${session.person} to follow`}
              >
                {session.initials}
              </div>
              <div>
                <h2 className="font-serif text-2xl text-navy">{session.person}</h2>
                <p className="text-sm text-muted">CRR {session.crr}</p>
                <p className="mt-1 text-sm font-semibold text-green">
                  {session.time} {session.meridiem} IST
                </p>
              </div>
            </div>
            <h3 className="mt-4 font-serif text-lg leading-snug text-ink">{session.title}</h3>
            <p className="mt-3 leading-7 text-muted">{session.relevance}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
