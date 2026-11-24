import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { AckActions } from "@/components/ack-actions";
import { CertificateActions } from "@/components/certificate-actions";
import { PageBanner } from "@/components/page-banner";
import { participantTokenOk } from "@/lib/admin";
import { programme } from "@/lib/programme";
import { creJourney, creStamp, participationStamp, paymentState, paymentText, rciState, rciText, type Stamp } from "@/lib/status";
import {
  certificateEligible,
  certificateFileName,
  certificateNumberText,
  certificatesReleased,
  certificateVerifyUrl,
  ensureCertificate,
  linkedInAddUrl,
  participantName,
  type IssuedCertificate,
} from "@/lib/certificates";
import { getRegistration, type Registration } from "@/lib/store";

export const metadata: Metadata = { title: "Registration status", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { reference } = await params;
  const { t = "" } = await searchParams;
  const key = reference.toUpperCase();
  const row = /^YDU-[A-Z2-9]{12}$/.test(key) && participantTokenOk(key, t) ? await getRegistration(key) : null;

  if (!row) {
    return (
      <div className="pb-24 md:pb-10">
        <PageBanner kicker="Registration" title="Status" accent="not found" lede="This link is not valid any more. Look up your registration with your reference and email." />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Link className="pill pill-solid" href="/registration/status">
            Look up my registration
          </Link>
        </div>
      </div>
    );
  }

  const pay = paymentState(row);
  const rci = rciState(row);
  const eligible = certificateEligible(row);
  const released = eligible && (await certificatesReleased());
  const issued = released ? await ensureCertificate(row) : null;
  const host = (await headers()).get("host") ?? "yenepoya-cre.vercel.app";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const stamps = [participationStamp(row), creStamp(row)];
  const tone = (value: Stamp) =>
    value.tone === "ok" ? "border-green text-green" : value.tone === "stop" ? "border-red-700 text-red-700" : value.tone === "wait" ? "border-green-dark text-green-dark" : "border-line text-muted";
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner kicker="Registration status" title={row.reference} lede={`${programme.title} · ${programme.dateLabel}`} />
      <div className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <section className="card grid gap-4 p-6">
          <div className="flex flex-wrap gap-3">
            {stamps.map((value) => (
              <div key={value.title} className={`grid min-w-[9rem] place-items-center rounded-full border-2 px-5 py-3 text-center ${tone(value)}`}>
                <span className="text-[0.65rem] font-semibold tracking-[0.14em]">{value.title}</span>
                <span className="font-display text-xl tracking-tight">{value.word}</span>
              </div>
            ))}
          </div>
          <p className="text-lg font-semibold text-navy">
            {row.title ? `${row.title} ` : ""}
            {row.fullName}
          </p>
          <ul className="grid gap-2 text-sm leading-6">
            <li>✓ Registered</li>
            <li>{pay === "confirmed" ? "✓" : pay === "rejected" ? "✗" : "…"} {paymentText[pay]}</li>
            <li>{rci === "confirmed" ? "✓" : rci === "rejected" ? "✗" : rci === "awaited" || rci === "submitted" ? "…" : "·"} {rciText[rci]}</li>
          </ul>
          {rci === "awaited" ? (
            <p className="rounded-2xl bg-gold/20 px-4 py-3 text-sm leading-6 text-navy">
              <b>Action needed for CRE points:</b> RCI has approved this programme (F. No. {programme.rciFileNo}). Register for it on the{" "}
              <a className="font-semibold underline" href={programme.rciCalendarUrl} target="_blank" rel="noopener noreferrer">
                RCI website ({programme.rciPortal})
              </a>{" "}
              with your CRR login, then upload the confirmation mail on{" "}
              <Link className="font-semibold underline" href="/registration/rci">
                Add RCI confirmation
              </Link>
              .
            </p>
          ) : null}
          <AckActions reference={row.reference} token={t} />
        </section>
        <CertificateSection row={row} token={t} eligible={eligible} issued={issued} origin={origin} />
        <section className="card grid gap-3 p-6">
          <h2 className="font-display text-2xl text-navy">{row.creClaim === "yes" ? "Your RCI CRE journey" : "Your participation"}</h2>
          <ol className="grid gap-3">
            {creJourney(row).map((step) => (
              <li key={step.title} className="grid grid-cols-[1.75rem_1fr] gap-3 text-sm leading-6">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full font-bold ${
                    step.state === "done" ? "bg-green text-white" : step.state === "no" ? "bg-red-100 text-red-800" : step.state === "now" ? "bg-gold text-navy" : "bg-navy/10 text-navy"
                  }`}
                  aria-hidden="true"
                >
                  {step.state === "done" ? "✓" : step.state === "no" ? "✗" : step.state === "now" ? "…" : "·"}
                </span>
                <span>
                  <span className="font-semibold text-navy">{step.title}</span>
                  <span className="block text-muted">{step.note}</span>
                </span>
              </li>
            ))}
          </ol>
          {row.creClaim === "yes" ? (
            <p className="text-xs leading-5 text-muted">
              The online examination is conducted by RCI after the sessions, and CRE points appear on your individual profile on the{" "}
              <a className="underline" href="https://rehabcouncil.nic.in/" target="_blank" rel="noopener noreferrer">
                RCI website
              </a>
              . This page shows what the organisers have recorded; your RCI profile is the official record.
            </p>
          ) : null}
          <a className="text-sm font-semibold text-green underline" href={programme.whatsappUrl} target="_blank" rel="noopener noreferrer">
            Join the participants&apos; WhatsApp group
          </a>
        </section>
      </div>
    </div>
  );
}

function CertificateSection({
  row,
  token,
  eligible,
  issued,
  origin,
}: {
  row: Registration;
  token: string;
  eligible: boolean;
  issued: IssuedCertificate | null;
  origin: string;
}) {
  if (!issued) {
    return (
      <section className="card grid gap-2 p-6">
        <h2 className="font-display text-2xl text-navy">Your e-certificate</h2>
        <p className="text-sm leading-6 text-muted">
          {eligible
            ? `Your certificate of participation will appear here after the programme on ${programme.dateLabel}, ready to download, share and add to LinkedIn. It will also be emailed to you.`
            : "The certificate of participation is issued once your payment is confirmed."}
        </p>
      </section>
    );
  }
  const verifyUrl = certificateVerifyUrl(origin, row.reference);
  const pdfUrl = `/api/certificate/${row.reference}?t=${encodeURIComponent(token)}`;
  return (
    <section className="card grid gap-5 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green">Ready</p>
        <h2 className="font-display text-2xl text-navy">Your e-certificate</h2>
      </div>
      <CertificatePreview name={participantName(row)} number={certificateNumberText(issued.number)} />
      <CertificateActions pdfUrl={pdfUrl} fileName={certificateFileName(row, issued)} verifyUrl={verifyUrl} linkedInUrl={linkedInAddUrl(row, issued, verifyUrl)} />
      <p className="text-xs leading-5 text-muted">
        Keep the PDF safe: its QR code opens a page confirming the certificate is genuine. Need a copy to print?{" "}
        <a className="font-semibold text-green underline" href={`${pdfUrl}&edition=print&download=1`}>
          Download the print edition
        </a>{" "}
        (A4 landscape, print at actual size).
      </p>
    </section>
  );
}

/** A small HTML likeness of the certificate, so participants see it at a glance before opening the PDF. */
function CertificatePreview({ name, number }: { name: string; number: string }) {
  return (
    <div className="rounded-xl bg-[#0F214A] p-2 shadow-sm" aria-hidden="true">
      <div className="relative grid aspect-[1.414] place-items-center overflow-hidden rounded-md border border-[#B08D3E] bg-[#FBF8F0] p-4 text-center">
        <div className="pointer-events-none absolute inset-2 rounded border border-dashed border-[#D9C28C]" />
        <div className="grid gap-1">
          <p className="text-[0.55rem] font-semibold tracking-[0.18em] text-[#0F214A] sm:text-[0.65rem]">YENEPOYA · DEPARTMENT OF ASLP</p>
          <p className="font-serif text-xl tracking-[0.3em] text-[#0F214A] sm:text-3xl">CERTIFICATE</p>
          <p className="font-serif text-sm italic text-[#E4570B] sm:text-lg">of Participation</p>
          <p className="mt-2 font-serif text-lg italic text-[#0F214A] sm:text-2xl">{name}</p>
          <div className="mx-auto h-px w-2/3 bg-[#B08D3E]" />
          <p className="mt-1 text-[0.6rem] text-[#5C6678] sm:text-xs">
            {programme.title} · {programme.dateLabel}
          </p>
          <p className="text-[0.55rem] text-[#5C6678] sm:text-[0.65rem]">{number}</p>
        </div>
        <span className="absolute bottom-3 left-4 grid h-9 w-9 place-items-center rounded-full bg-[#C9A24B] text-[0.45rem] font-bold text-[#FBF8F0] ring-2 ring-[#B08D3E] sm:h-12 sm:w-12 sm:text-[0.55rem]">
          RPwD
        </span>
      </div>
    </div>
  );
}
