import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { certificateCodeOk } from "@/lib/admin";
import { certificateEligible, certificateIssueDate, rowCertificateNumber, certificatesReleased, participantName } from "@/lib/certificates";
import { certificateSignatories, isOnlineTrack, onlineProgramme, programme } from "@/lib/programme";
import { getRegistration } from "@/lib/store";

export const metadata: Metadata = { title: "Verify a certificate", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Opened from the verification link shared with an e-certificate. Confirms that the certificate was issued by the department
 * and shows only what is printed on it — never the participant's email, phone or payment.
 */
export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { reference } = await params;
  const { c = "" } = await searchParams;
  const key = reference.toUpperCase();
  const row = /^YDU-[A-Z2-9]{12}$/.test(key) && certificateCodeOk(key, c) ? await getRegistration(key) : null;
  const issued = row?.deskReview?.certificate;
  const valid = Boolean(row && issued && certificateEligible(row) && (await certificatesReleased()));

  if (!row || !issued || !valid) {
    return (
      <div className="pb-24 md:pb-10">
        <PageBanner kicker="Certificate check" title="Not" accent="verified" lede="This link does not match a certificate issued for this programme." />
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-6 text-muted">
          <p>
            Open the verification link from your status page again, or write to{" "}
            <a className="font-semibold text-green underline" href={`mailto:${programme.email}`}>
              {programme.email}
            </a>{" "}
            with the certificate number to confirm it.
          </p>
        </div>
      </div>
    );
  }

  const rows: [string, string][] = [
    ["Awarded to", participantName(row)],
    ["Certificate No.", rowCertificateNumber(row, issued)],
    ["Certificate", "Participation"],
    ["Programme", `${programme.title}: ${programme.subtitle}`],
    ["Type", isOnlineTrack(row) ? `${onlineProgramme.name} (non-RCI) — ${onlineProgramme.noCreLine}` : `${programme.level} Continuing Rehabilitation Education (CRE), online`],
    ["Held on", programme.dateLabel],
    ["Issued by", `${programme.organiser}, ${programme.hospital}, ${programme.university}`],
    ["Issued on", new Date(certificateIssueDate(issued)).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" })],
    ["Signed by", certificateSignatories.map((person) => `${person.name} (${person.role})`).join(" · ")],
  ];

  return (
    <div className="pb-24 md:pb-10">
      <PageBanner kicker="Certificate check" title="Verified" accent="certificate" lede={`Issued by the ${programme.organiser}, Yenepoya.`} />
      <div className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <section className="card grid gap-5 p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-green text-2xl font-bold text-white" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green">Genuine certificate</p>
              <p className="font-display text-2xl text-navy">{participantName(row)}</p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm leading-6 sm:grid-cols-[10rem_1fr]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-semibold text-muted">{label}</dt>
                <dd className="text-navy">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs leading-5 text-muted">
            This page is the online record of the certificate. RCI CRE points, where claimed, are shown on the participant&apos;s own profile on the RCI website.
          </p>
        </section>
      </div>
    </div>
  );
}
