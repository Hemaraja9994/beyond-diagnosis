import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeskFields, DeskUploads } from "@/components/desk-fields";
import { PageBanner } from "@/components/page-banner";
import { currentAdmin, deskUser, participantToken } from "@/lib/admin";
import { docLabels, type DocKind } from "@/lib/proof";
import { sourceLabel } from "@/lib/programme";
import { creStamp, participationStamp, paymentState, paymentText, rciState, rciText } from "@/lib/status";
import { getRegistration } from "@/lib/store";
import { statusLabel } from "@/lib/verify-types";

export const metadata: Metadata = { title: "Edit registration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const decisions: [string, string][] = [
  ["pay-verified", "Payment verified"],
  ["pay-rejected", "Payment rejected"],
  ["pay-clear", "Clear payment decision"],
  ["rci-confirmed", "RCI confirmed"],
  ["rci-rejected", "RCI not accepted"],
  ["rci-clear", "Clear RCI decision"],
  ["att-attended", "Attended"],
  ["att-absent", "Absent"],
  ["att-clear", "Clear attendance"],
  ["exam-passed", "RCI exam passed"],
  ["exam-not-passed", "RCI exam not passed"],
  ["exam-not-taken", "RCI exam not taken"],
  ["exam-clear", "Clear exam"],
  ["pts-credited", "CRE points credited"],
  ["pts-clear", "Clear points"],
];

export default async function EditRegistrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = deskUser(await currentAdmin());
  if (!user) redirect("/admin");
  const { reference } = await params;
  const { saved } = await searchParams;
  const row = await getRegistration(reference.toUpperCase());
  if (!row) redirect("/admin");
  const token = participantToken(row.reference);
  const files: DocKind[] = [...row.documents];
  if (row.paymentProof !== "" && !files.includes("payment")) files.unshift("payment");

  return (
    <div className="pb-24 md:pb-10">
      <PageBanner kicker="Coordinator desk · master control" title={row.reference} lede={`${row.title ? `${row.title} ` : ""}${row.fullName} · ${sourceLabel(row.source)}`} />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        <p className="text-sm">
          <Link className="font-semibold text-green underline" href={`/admin#${row.reference}`}>
            ← Back to the desk
          </Link>
          {token ? (
            <>
              {" · "}
              <a className="font-semibold text-green underline" href={`/status/${row.reference}?t=${encodeURIComponent(token)}`} target="_blank" rel="noopener noreferrer">
                Participant&apos;s status page / PDF
              </a>
            </>
          ) : null}
        </p>
        {saved ? (
          <p className="rounded-2xl bg-navy/5 px-4 py-3 font-semibold text-navy" role="status">
            {saved}
          </p>
        ) : null}

        <section className="card grid gap-2 p-5 text-sm leading-6">
          <h2 className="font-display text-xl text-navy">Status now</h2>
          <p>
            <strong>{participationStamp(row).title}:</strong> {participationStamp(row).word} · <strong>{creStamp(row).title}:</strong> {creStamp(row).word}
          </p>
          <p>Payment: {paymentText[paymentState(row)]} (automatic check: {statusLabel(row.verification?.status)})</p>
          <p>RCI: {rciText[rciState(row)]}</p>
          {row.verification ? <p className="text-muted">{row.verification.summary}</p> : null}
          <p>
            Files:{" "}
            {files.length === 0
              ? "none"
              : files.map((kind, index) => (
                  <span key={kind}>
                    {index > 0 ? " · " : ""}
                    <a className="font-semibold text-green underline" href={`/api/admin/file/${row.reference}/${kind}`} target="_blank" rel="noopener noreferrer">
                      {docLabels[kind]}
                    </a>
                  </span>
                ))}
          </p>
        </section>

        <form className="card grid gap-4 p-5" action={`/api/admin/edit/${row.reference}`} method="post" encType="multipart/form-data">
          <h2 className="font-display text-xl text-navy">Edit details</h2>
          <input type="hidden" name="action" value="details" />
          <DeskFields row={row} />
          <h3 className="font-semibold text-navy">Upload or replace documents (optional)</h3>
          <DeskUploads />
          <button className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white" type="submit">
            Save changes
          </button>
          <p className="text-xs text-muted">Saved changes are re-checked automatically, and any email that becomes due is sent.</p>
        </form>

        <section className="card p-5">
          <h2 className="font-display text-xl text-navy">Decisions (override the automatic check)</h2>
          <form action={`/api/admin/review/${row.reference}`} method="post" className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="return" value="edit" />
            {decisions.map(([action, label]) => (
              <button
                key={action}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${action.endsWith("clear") ? "border border-line" : action.includes("reject") || action.includes("not") || action.includes("absent") ? "border border-red-300 text-red-800" : "bg-green text-white"}`}
                name="action"
                value={action}
                type="submit"
              >
                {label}
              </button>
            ))}
          </form>
          <form action={`/api/admin/mail/${row.reference}`} method="post" className="mt-3">
            <button className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold" type="submit">
              Resend confirmation email
            </button>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl text-navy">Change history</h2>
          {row.deskReview?.history?.length ? (
            <ol className="mt-3 grid gap-1 text-sm">
              {[...row.deskReview.history].reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`}>
                  <span className="text-muted">{new Date(entry.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span> · <strong>{entry.by}</strong> · {entry.what}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted">No changes by coordinators yet.</p>
          )}
        </section>

        <section className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-display text-xl text-red-800">Delete this registration</h2>
          <p className="mt-1 text-sm text-red-800">This removes the registration and its files for good. Type {row.reference} to confirm.</p>
          <form action={`/api/admin/delete/${row.reference}`} method="post" className="mt-3 flex flex-wrap gap-2">
            <input className="field max-w-xs" name="confirm" placeholder={row.reference} autoComplete="off" />
            <button className="min-h-11 rounded-full bg-red-700 px-5 font-semibold text-white" type="submit">
              Delete for good
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
