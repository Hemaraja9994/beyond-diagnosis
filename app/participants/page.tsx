import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/page-banner";
import { participantName } from "@/lib/certificates";
import { isOnlineTrack, programme } from "@/lib/programme";
import { holdsCrePlace } from "@/lib/seats";
import { paymentState } from "@/lib/status";
import { listRegistrations } from "@/lib/store";

export const metadata: Metadata = {
  title: "Registered participants",
  description: "Names and RCI CRR numbers of everyone registered for the CRE.",
  robots: { index: false, follow: false },
};
// Rebuilt at most every five minutes, so the page does not read the database on every visit.
export const revalidate = 300;

/**
 * Public list of registered participants for the RCI webinar.
 * Shows only the name, the CRR number and whether the person holds an RCI CRE place —
 * never the email, phone, payment or uploaded documents. People on the regular online programme (non-RCI:
 * students, parents and others without a CRR number) are not listed.
 */
export default async function ParticipantsPage() {
  const rows = (await listRegistrations())
    .filter((row) => paymentState(row) !== "rejected" && !isOnlineTrack(row))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const claimants = rows.filter(holdsCrePlace).length;
  const updated = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="RCI webinar · 19 December 2026"
        title="Registered"
        accent="participants"
        lede="Everyone registered for the programme, with their RCI CRR number. Participants claiming RCI CRE points are marked in the last column."
      />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Registered</p>
            <p className="mt-1 font-display text-3xl text-navy">{rows.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">RCI CRE claimants</p>
            <p className="mt-1 font-display text-3xl text-green">{claimants}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Participants only</p>
            <p className="mt-1 font-display text-3xl text-navy">{rows.length - claimants}</p>
          </div>
        </div>

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    No.
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    RCI CRR No.
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    RCI CRE claimant
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const claimant = holdsCrePlace(row);
                  return (
                    <tr key={row.reference} className="border-t border-black/10 odd:bg-black/[0.02]">
                      <td className="px-4 py-3 tabular-nums text-muted">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-navy">{participantName(row)}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-navy">{row.crrNumber.trim().toUpperCase() || "—"}</td>
                      <td className="px-4 py-3">
                        {claimant ? (
                          <span className="inline-flex rounded-full bg-green px-3 py-1 text-xs font-semibold text-white">Yes</span>
                        ) : (
                          <span className="inline-flex rounded-full border border-black/15 px-3 py-1 text-xs font-semibold text-muted">
                            No · participant
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      No registrations yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-2 text-sm leading-6 text-muted">
          <p>
            Listed in order of registration. Updated {updated} IST. Only names and CRR numbers are shown here; contact and payment details
            stay private.
          </p>
          <p>
            Name or CRR number wrong, or not listed? Check{" "}
            <Link href="/registration/status" className="font-semibold text-green underline">
              your registration status
            </Link>{" "}
            or write to{" "}
            <a className="font-semibold text-green underline" href={`mailto:${programme.email}`}>
              {programme.email}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
