import type { Metadata } from "next";
import Link from "next/link";
import { AckActions } from "@/components/ack-actions";
import { PageBanner } from "@/components/page-banner";
import { participantTokenOk } from "@/lib/admin";
import { programme } from "@/lib/programme";
import { creJourney, overallState, paymentState, paymentText, rciState, rciText } from "@/lib/status";
import { getRegistration } from "@/lib/store";

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
  const overall = overallState(row);
  const tone = overall.tone === "ok" ? "text-green" : overall.tone === "stop" ? "text-red-700" : "text-green-dark";
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner kicker="Registration status" title={row.reference} lede={`${programme.title} · ${programme.dateLabel}`} />
      <div className="mx-auto grid max-w-3xl gap-6 px-4 py-10">
        <section className="card grid gap-4 p-6">
          <p className={`font-display text-3xl tracking-tight ${tone}`}>{overall.word}</p>
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
            <p className="rounded-2xl bg-navy/5 px-4 py-3 text-sm leading-6 text-navy">
              Once you register for this programme on the RCI website, upload the confirmation mail on{" "}
              <Link className="font-semibold underline" href="/registration/rci">
                Add RCI confirmation
              </Link>
              .
            </p>
          ) : null}
          <AckActions reference={row.reference} token={t} />
        </section>
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
