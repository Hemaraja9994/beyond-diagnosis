import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { MeetingForm } from "@/components/meeting-form";
import { PageBanner } from "@/components/page-banner";
import { adminReady, currentAdmin, deskUser } from "@/lib/admin";
import { deskAccounts, deskCoordinatorLine, professionLabel, programme, sourceLabel, type ArrivalSource, type Profession } from "@/lib/programme";
import { docLabels, type DocKind } from "@/lib/proof";
import { participantToken } from "@/lib/admin";
import { mailReady, mailSender } from "@/lib/mail";
import { mailsDue } from "@/lib/notify";
import { deskNumbers, type DeskNumbers } from "@/lib/seats";
import { creSeatLimit, registrationOpen } from "@/lib/settings";
import { paymentState, paymentText, rciState, rciText } from "@/lib/status";
import { getDeskPasswordHash, getMeetingUrl, listQueries, listRegistrations, storageMode, type Registration } from "@/lib/store";
import { statusLabel, type VerificationStatus } from "@/lib/verify-types";

export const metadata: Metadata = { title: "Coordinator desk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const badge: Record<VerificationStatus | "none", string> = {
  verified: "bg-green/15 text-green-dark",
  review: "bg-gold/25 text-navy",
  mismatch: "bg-red-100 text-red-800",
  none: "bg-navy/10 text-navy",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ checked?: string; password?: string; bulk?: string; mail?: string; q?: string; view?: string }> }) {
  const { checked, password, bulk, mail, q = "", view = "all" } = await searchParams;
  const user = deskUser(await currentAdmin());
  if (!user) {
    return (
      <div className="pb-10">
        <PageBanner
          kicker="Coordinator desk"
          title="For the desk coordinators"
          lede={`${deskCoordinatorLine()} each sign in with their own username and password to check payments and RCI confirmations, export the participant register, and publish the Webex link.`}
        />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <LoginForm ready={adminReady()} />
        </div>
      </div>
    );
  }

  const [seatLimit, isOpen] = await Promise.all([creSeatLimit(), registrationOpen()]);
  const [registrations, queries, meeting, passwordsSet] = await Promise.all([
    listRegistrations(),
    listQueries(),
    getMeetingUrl(),
    Promise.all(deskAccounts.map(async (account) => (await getDeskPasswordHash(account.username)) !== null)),
  ]);
  const mode = storageMode();
  const query = q.trim().toLowerCase();
  const shown = registrations.filter((row) => {
    if (query && ![row.reference, row.fullName, row.email, row.mobile, row.crrNumber, row.paymentReference, row.institution].some((value) => value.toLowerCase().includes(query))) return false;
    switch (view) {
      case "attention":
        return paymentState(row) !== "confirmed" || rciState(row) === "submitted";
      case "confirmed":
        return paymentState(row) === "confirmed";
      case "cre":
        return row.creClaim === "yes";
      case "rci-awaited":
        return rciState(row) === "awaited" || rciState(row) === "submitted";
      default:
        return true;
    }
  });
  const emailOn = mailReady();
  const emailsDue = registrations.filter((row) => mailsDue(row).length > 0).length;
  const counts = { verified: 0, review: 0, mismatch: 0, none: 0, claiming: 0, confirmed: 0 };
  for (const row of registrations) {
    if (paymentState(row) === "confirmed") counts.confirmed += 1;
    counts[row.verification?.status ?? "none"] += 1;
    if (row.creClaim === "yes") counts.claiming += 1;
  }

  return (
    <div className="pb-10">
      <PageBanner
        kicker="Coordinator desk"
        title="Registrations and queries"
        lede={`Signed in as ${user.name}. Check payments and RCI confirmations, export the participant register, or publish the Cisco Webex link.`}
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        {mode === "local" ? (
          <p className="rounded-2xl bg-navy/5 px-4 py-3 text-sm leading-6 text-green-dark">
            This copy is using a temporary database on the machine that is running it. A published deployment stores registrations in its own database or in the connected file store.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <a className="inline-flex min-h-11 items-center rounded-full bg-green px-4 font-semibold text-white" href="/api/admin/export/registrations">
            Export registrations CSV
          </a>
          <a className="inline-flex min-h-11 items-center rounded-full bg-navy px-4 font-semibold text-white" href="/api/admin/export/register?format=pdf">
            Participant register (PDF)
          </a>
          <a className="inline-flex min-h-11 items-center rounded-full bg-navy px-4 font-semibold text-white" href="/api/admin/export/register?format=docx">
            Participant register (Word)
          </a>
          <a className="inline-flex min-h-11 items-center rounded-full bg-green px-4 font-semibold text-white" href="/api/admin/export/rci">
            RCI list (verified, claiming CRE)
          </a>
          <a className="inline-flex min-h-11 items-center rounded-full border border-line px-4 font-semibold" href="/api/admin/export/rci?all=1">
            RCI list (all claiming)
          </a>
          <a className="inline-flex min-h-11 items-center rounded-full bg-navy px-4 font-semibold text-white" href="/api/admin/export/queries">
            Export queries CSV
          </a>
          <form action="/api/admin/logout" method="post">
            <button className="min-h-11 rounded-full border border-line px-4 font-semibold" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <section className="flex flex-wrap items-center gap-3">
          <Link className="inline-flex min-h-11 items-center rounded-full bg-green px-4 font-semibold text-white" href="/admin/new">
            + Add a registration
          </Link>
          <a className="inline-flex min-h-11 items-center rounded-full border border-line px-4 font-semibold" href="/guides/coordinator-desk-guide.pdf" target="_blank" rel="noopener noreferrer">
            Coordinator guide (PDF)
          </a>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isOpen ? "bg-green/15 text-green-dark" : "bg-red-100 text-red-800"}`}>
            Registration {isOpen ? "open" : "closed"}
          </span>
        </section>
        <Dashboard numbers={deskNumbers(registrations, seatLimit)} />
        <section id="registrations">
          <h2 className="font-display text-2xl text-navy">Registrations ({registrations.length})</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Receipts, CRR certificates and RCI mails are read automatically on this server (free OCR, no outside AI). The badge is the automatic
            check; your own &ldquo;Mark verified / Reject&rdquo; decision always wins and is what the participant sees. Nothing is rejected automatically.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {(["verified", "review", "mismatch", "none"] as const).map((key) => (
              <span key={key} className={`rounded-full px-3 py-1 font-semibold ${badge[key]}`}>
                {statusLabel(key === "none" ? undefined : key)}: {counts[key]}
              </span>
            ))}
            <span className="rounded-full bg-navy/5 px-3 py-1 font-semibold text-navy">Payment confirmed: {counts.confirmed}</span>
            <span className="rounded-full bg-navy/5 px-3 py-1 font-semibold text-navy">Claiming CRE: {counts.claiming}</span>
            {counts.none > 0 ? (
              <form action="/api/admin/verify-pending" method="post">
                <button className="min-h-9 rounded-full bg-navy px-3 font-semibold text-white" type="submit">
                  Check unchecked (up to 8)
                </button>
              </form>
            ) : null}
            {checked ? <span className="text-muted">Checked {checked} just now.</span> : null}
          </div>
          <div className="mt-3 rounded-2xl bg-navy/5 px-4 py-3 text-sm leading-6">
            {emailOn ? (
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  <strong className="text-navy">Email on</strong> — confirmations go out from {mailSender()} (copies stay in its Sent folder).
                </span>
                {emailsDue > 0 ? (
                  <form action="/api/admin/mail-pending" method="post">
                    <button className="min-h-9 rounded-full bg-navy px-3 font-semibold text-white" type="submit">
                      Send pending emails ({emailsDue}, 15 at a time)
                    </button>
                  </form>
                ) : (
                  <span className="text-muted">No emails pending.</span>
                )}
              </div>
            ) : (
              <span>
                <strong className="text-navy">Email off.</strong> To send confirmations, add <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code> (a Google
                App Password) in Vercel → Settings → Environment Variables, then redeploy.
              </span>
            )}
            {mail ? <p className="mt-1 font-semibold text-navy" role="status">{mail}</p> : null}
          </div>
          <form className="mt-3 flex flex-wrap items-end gap-3" action="/admin" method="get">
            <label className="grid gap-1 text-sm font-semibold text-navy">
              Search
              <input className="field" name="q" defaultValue={q} placeholder="Name, email, mobile, CRR, payment ID" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-navy">
              Show
              <select className="field" name="view" defaultValue={view}>
                <option value="all">Everyone</option>
                <option value="attention">Needs attention</option>
                <option value="confirmed">Payment confirmed</option>
                <option value="cre">Claiming CRE points</option>
                <option value="rci-awaited">RCI confirmation awaited</option>
              </select>
            </label>
            <button className="min-h-11 rounded-full bg-navy px-4 font-semibold text-white" type="submit">
              Filter
            </button>
            {query || view !== "all" ? (
              <a className="min-h-11 content-center text-sm font-semibold text-green underline" href="/admin#registrations">
                Clear
              </a>
            ) : null}
            <span className="text-sm text-muted">
              Showing {shown.length} of {registrations.length}
            </span>
          </form>
          {shown.length === 0 ? (
            <p className="mt-3 text-muted">{registrations.length === 0 ? "No one has registered yet." : "No registrations match."}</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-3xl ring-1 ring-line">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <caption className="sr-only">Registrations</caption>
                <thead className="bg-paper text-muted">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Reference</th>
                    <th className="px-3 py-3 font-semibold">Participant</th>
                    <th className="px-3 py-3 font-semibold">CRE / CRR</th>
                    <th className="px-3 py-3 font-semibold">Payment</th>
                    <th className="px-3 py-3 font-semibold">Check</th>
                    <th className="px-3 py-3 font-semibold">Webex · RCI exam · points</th>
                    <th className="px-3 py-3 font-semibold">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row) => (
                    <RegistrationRow key={row.id} row={row} token={participantToken(row.reference)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-display text-2xl text-navy">Participant register for documentation</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            A4 landscape, with the college logo, programme details and every participant. Pick which participants to include.
          </p>
          <form className="mt-3 flex flex-wrap items-end gap-3" action="/api/admin/export/register" method="get">
            <label className="grid gap-1 text-sm font-semibold text-navy">
              Include
              <select className="field" name="filter" defaultValue="all">
                <option value="all">All registrations</option>
                <option value="confirmed">Payment confirmed only</option>
                <option value="cre">Claiming RCI CRE points</option>
                <option value="pending">Payment still to be confirmed</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-navy">
              Format
              <select className="field" name="format" defaultValue="pdf">
                <option value="pdf">PDF (print)</option>
                <option value="docx">Word (.docx, editable)</option>
              </select>
            </label>
            <button className="min-h-11 rounded-full bg-green px-4 font-semibold text-white" type="submit">
              Download register
            </button>
          </form>
        </section>
        <section id="bulk" className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-display text-2xl text-navy">Bulk update</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Paste emails, CRR numbers or YDU- references — one per line, or copied straight from the Webex attendance report or a list from RCI.
            Every matching participant gets the decision you choose, recorded with your name.
          </p>
          {bulk ? <p className="mt-2 text-sm font-semibold text-navy" role="status">{bulk}</p> : null}
          <form className="mt-3 grid gap-3" action="/api/admin/bulk" method="post">
            <textarea className="field min-h-28 font-mono text-xs" name="list" required placeholder={"name@example.com\nA81760\nYDU-…"} />
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1 text-sm font-semibold text-navy">
                Mark them as
                <select className="field" name="action" defaultValue="att-attended">
                  <option value="att-attended">Attended on Webex</option>
                  <option value="exam-passed">RCI online exam — passed</option>
                  <option value="exam-not-passed">RCI online exam — not passed</option>
                  <option value="pts-credited">CRE points credited on RCI profile</option>
                  <option value="rci-confirmed">RCI registration confirmed</option>
                  <option value="pay-verified">Payment verified</option>
                </select>
              </label>
              <button className="min-h-11 rounded-full bg-navy px-4 font-semibold text-white" type="submit">
                Apply
              </button>
            </div>
          </form>
        </section>
        <section id="settings" className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-display text-2xl text-navy">Site switches</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Changes apply on the site at once. Places given by a coordinator beyond the limit are allowed and counted.</p>
          <form className="mt-3 flex flex-wrap items-end gap-3" action="/api/admin/settings" method="post">
            <label className="grid gap-1 text-sm font-semibold text-navy">
              RCI CRE places
              <input className="field w-28" name="creSeats" type="number" min={0} max={2000} defaultValue={seatLimit} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-navy">
              Registration
              <select className="field" name="registrationOpen" defaultValue={isOpen ? "yes" : "no"}>
                <option value="yes">Open</option>
                <option value="no">Closed</option>
              </select>
            </label>
            <button className="min-h-11 rounded-full bg-navy px-4 font-semibold text-white" type="submit">
              Save switches
            </button>
          </form>
        </section>
        <section id="accounts" className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-display text-2xl text-navy">Coordinator accounts</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Each coordinator signs in with her username and her own password. Passwords are stored only as a scrambled hash.
            {" Any coordinator can set or reset any of these passwords."}
          </p>
          {password ? <p className="mt-2 text-sm font-semibold text-navy" role="status">{password}</p> : null}
          <ul className="mt-3 grid gap-3">
            {deskAccounts.map((account, index) =>
              (
                <li key={account.username}>
                  <form className="flex flex-wrap items-end gap-3" action="/api/admin/password" method="post">
                    <input type="hidden" name="username" value={account.username} />
                    <p className="min-w-[14rem] text-sm">
                      <span className="font-semibold text-navy">{account.name}</span>
                      <span className="block text-muted">
                        Username <code>{account.username}</code> · {passwordsSet[index] ? "own password set" : "using the starting password — please change it"}
                      </span>
                    </p>
                    <label className="grid gap-1 text-sm font-semibold text-navy">
                      New password
                      <input className="field" name="password" type="password" minLength={10} autoComplete="new-password" required />
                    </label>
                    <button className="min-h-11 rounded-full bg-navy px-4 font-semibold text-white" type="submit">
                      Save password
                    </button>
                  </form>
                </li>
              ),
            )}
          </ul>
        </section>
        <section className="rounded-3xl bg-card p-5 ring-1 ring-line">
          <h2 className="font-display text-2xl text-navy">Webex link</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Only an https address on webex.com is accepted. Join and the RCI attend page use it immediately.</p>
          <div className="mt-4 max-w-xl">
            <MeetingForm current={meeting} />
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl text-navy">Queries ({queries.length})</h2>
          {queries.length === 0 ? (
            <p className="mt-3 text-muted">No queries yet.</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {queries.map((query) => (
                <li key={query.id} className="rounded-3xl bg-card p-4 ring-1 ring-line">
                  <p className="font-semibold text-navy">{query.topic}</p>
                  <p className="text-sm text-muted">
                    {query.fullName} · {query.email}
                  </p>
                  <p className="mt-2 leading-7">{query.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function RegistrationRow({ row, token }: { row: Registration; token: string | null }) {
  const statusLink = token ? `/status/${row.reference}?t=${encodeURIComponent(token)}` : "";
  const whatsapp = `https://wa.me/91${row.mobile}?text=${encodeURIComponent(
    `Dear ${row.title ? `${row.title} ` : ""}${row.fullName}, this is the ${programme.title} CRE desk (${row.reference}). ${paymentText[paymentState(row)]}.${
      row.creClaim === "yes" ? ` ${rciText[rciState(row)]}.` : ""
    }`,
  )}`;
  const status = row.verification?.status;
  const files: DocKind[] = [...row.documents];
  if (row.paymentProof !== "" && !files.includes("payment")) files.unshift("payment");
  return (
    <tr id={row.reference} className="border-t border-line bg-card align-top">
      <td className="px-3 py-3">
        <p className="font-semibold">{row.reference}</p>
        <p className="text-xs text-muted">{new Date(row.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
        <p className="text-xs text-muted">{sourceLabel(row.source as ArrivalSource)}</p>
      </td>
      <td className="px-3 py-3">
        <p className="font-semibold">
          {row.title ? `${row.title} ` : ""}
          {row.fullName}
        </p>
        <p className="text-muted">{row.email}</p>
        <p className="text-muted">{row.mobile}</p>
        <p className="mt-1 flex flex-wrap gap-2 text-xs font-semibold">
          <Link className="rounded-full bg-navy px-2 py-0.5 text-white" href={`/admin/edit/${row.reference}`}>
            Edit / control
          </Link>
          <a className="text-green underline" href={whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a className="text-green underline" href={`mailto:${row.email}?subject=${encodeURIComponent(`${programme.title} — ${row.reference}`)}`}>
            Email
          </a>
          {statusLink ? (
            <a className="text-green underline" href={statusLink} target="_blank" rel="noopener noreferrer">
              Status / PDF
            </a>
          ) : null}
        </p>
        <p className="text-muted">
          {professionLabel(row.profession as Profession)}
          {row.professionDetail ? ` · ${row.professionDetail}` : ""}
        </p>
      </td>
      <td className="px-3 py-3">
        <p>{row.creClaim === "yes" ? "Claiming" : row.creClaim === "no" ? "Not claiming" : "Not stated"}</p>
        <p className="font-semibold">{row.crrNumber}</p>
        {row.creClaim === "yes" ? (
          <>
            <p className={rciState(row) === "confirmed" ? "text-green" : "text-muted"}>{rciText[rciState(row)]}</p>
            {row.deskReview?.rci ? <p className="text-xs text-muted">by {row.deskReview.rci.by}</p> : null}
            <DeskButtons reference={row.reference} prefix="rci" yes="confirmed" yesLabel="RCI confirmed" set={row.deskReview?.rci?.decision} />
          </>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <p className="break-all font-mono text-xs">{row.paymentReference || "—"}</p>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge[status ?? "none"]}`}>{statusLabel(status)}</span>
        {row.verification ? <p className="mt-1 max-w-[16rem] text-xs leading-5 text-muted">{row.verification.summary}</p> : null}
        <p className={`mt-1 text-xs font-semibold ${paymentState(row) === "confirmed" ? "text-green" : "text-navy"}`}>
          Participant sees: {paymentText[paymentState(row)]}
          {row.deskReview?.payment ? ` (by ${row.deskReview.payment.by})` : ""}
        </p>
        <DeskButtons reference={row.reference} prefix="pay" yes="verified" yesLabel="Mark verified" set={row.deskReview?.payment?.decision} />
      </td>
      <td className="px-3 py-3">
        {row.verification ? (
          <details className="max-w-[18rem] text-xs leading-5">
            <summary className="cursor-pointer font-semibold text-navy">Details</summary>
            <ul className="mt-1 grid gap-1">
              {row.verification.checks.map((check) => (
                <li key={check.label}>
                  <span className={check.result === "pass" ? "text-green" : check.result === "fail" ? "text-red-700" : "text-navy"}>
                    {check.result === "pass" ? "✓" : check.result === "fail" ? "✗" : "!"} {check.label}
                  </span>
                  <span className="block text-muted">{check.note}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-muted">
              {new Date(row.verification.checkedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
            </p>
          </details>
        ) : null}
        <form action={`/api/admin/verify/${row.reference}`} method="post" className="mt-2">
          <button className="rounded-full border border-line px-3 py-1 text-xs font-semibold" type="submit">
            {row.verification ? "Check again" : "Check now"}
          </button>
        </form>
      </td>
      <td className="px-3 py-3 text-xs">
        <Journey row={row} />
      </td>
      <td className="px-3 py-3">
        {files.length === 0 ? (
          <p className="text-muted">No files</p>
        ) : (
          <ul className="grid gap-1">
            {files.map((kind) => (
              <li key={kind}>
                <a className="font-semibold text-green" href={`/api/admin/file/${row.reference}/${kind}`} target="_blank" rel="noopener noreferrer">
                  {docLabels[kind]}
                </a>
              </li>
            ))}
          </ul>
        )}
        {row.accessNeeds ? <p className="mt-2 max-w-[14rem] text-xs text-muted">Access: {row.accessNeeds}</p> : null}
        <p className="mt-2 text-xs text-muted">
          Emailed:{" "}
          {[row.deskReview?.mailed?.registration ? "registration" : "", row.deskReview?.mailed?.payment ? "payment" : "", row.deskReview?.mailed?.rci ? "RCI" : ""]
            .filter(Boolean)
            .join(", ") || "none yet"}
        </p>
        <form action={`/api/admin/mail/${row.reference}`} method="post" className="mt-1">
          <button className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold" type="submit">
            Resend confirmation
          </button>
        </form>
      </td>
    </tr>
  );
}

function DeskButtons({
  reference,
  prefix,
  yes,
  yesLabel,
  set,
}: {
  reference: string;
  prefix: "pay" | "rci";
  yes: string;
  yesLabel: string;
  set: string | undefined;
}) {
  return (
    <form action={`/api/admin/review/${reference}`} method="post" className="mt-2 flex flex-wrap gap-1">
      {set !== yes ? (
        <button className="rounded-full bg-green px-2.5 py-1 text-xs font-semibold text-white" name="action" value={`${prefix}-${yes}`} type="submit">
          {yesLabel}
        </button>
      ) : null}
      {set !== "rejected" ? (
        <button className="rounded-full border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-800" name="action" value={`${prefix}-rejected`} type="submit">
          Reject
        </button>
      ) : null}
      {set ? (
        <button className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold" name="action" value={`${prefix}-clear`} type="submit">
          Undo
        </button>
      ) : null}
    </form>
  );
}

function Journey({ row }: { row: Registration }) {
  const review = row.deskReview ?? {};
  const item = (label: string, value: string | undefined, by: string | undefined) => (
    <p>
      <span className="font-semibold text-navy">{label}:</span> {value ?? "—"}
      {by ? <span className="text-muted"> ({by})</span> : null}
    </p>
  );
  const button = (action: string, label: string) => (
    <button key={action} className="rounded-full border border-line px-2 py-0.5 font-semibold" name="action" value={action} type="submit">
      {label}
    </button>
  );
  return (
    <div className="grid gap-1">
      {item("Webex", review.attendance?.decision, review.attendance?.by)}
      {row.creClaim === "yes" ? item("RCI exam", review.exam?.decision.replace("-", " "), review.exam?.by) : null}
      {row.creClaim === "yes" ? item("Points", review.points ? "credited" : undefined, review.points?.by) : null}
      <form action={`/api/admin/review/${row.reference}`} method="post" className="mt-1 flex flex-wrap gap-1">
        {review.attendance?.decision !== "attended" ? button("att-attended", "Attended") : button("att-clear", "Undo attended")}
        {row.creClaim === "yes" ? (
          <>
            {review.exam ? button("exam-clear", "Undo exam") : [button("exam-passed", "Exam passed"), button("exam-not-passed", "Not passed")]}
            {review.points ? button("pts-clear", "Undo points") : button("pts-credited", "Points credited")}
          </>
        ) : null}
      </form>
    </div>
  );
}

function Dashboard({ numbers }: { numbers: DeskNumbers }) {
  const cre = numbers.cre;
  const share = cre.seats > 0 ? Math.min(100, Math.round((cre.taken / cre.seats) * 100)) : 0;
  const tile = (label: string, value: number | string, note?: string, strong = false) => (
    <div key={label} className={`rounded-2xl p-3 ring-1 ring-line ${strong ? "bg-navy text-white" : "bg-white"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.1em] ${strong ? "text-white/70" : "text-muted"}`}>{label}</p>
      <p className="mt-1 font-display text-3xl leading-none">{value}</p>
      {note ? <p className={`mt-1 text-xs ${strong ? "text-white/70" : "text-muted"}`}>{note}</p> : null}
    </div>
  );
  return (
    <section id="dashboard" className="rounded-3xl bg-card p-5 ring-1 ring-line">
      <h2 className="font-display text-2xl text-navy">Dashboard</h2>
      <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-green-dark">RCI CRE points — claimants</h3>
      <div className="mt-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-navy">
            Places taken: {cre.taken} of {cre.seats}
          </span>
          <span className={cre.left === 0 ? "font-semibold text-red-700" : "text-muted"}>{cre.left === 0 ? "Full" : `${cre.left} left`}</span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-navy/10" aria-hidden="true">
          <div className={`h-full rounded-full ${cre.left === 0 ? "bg-red-600" : "bg-green"}`} style={{ width: `${share}%` }} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {tile("Registered", cre.taken, "holding a place", true)}
        {tile("Payment confirmed", cre.paymentConfirmed, `${cre.taken - cre.paymentConfirmed} to check`)}
        {tile("RCI confirmed", cre.rciConfirmed, `${cre.rciUnderReview} under review`)}
        {tile("RCI awaited", cre.rciAwaited, "mail not uploaded")}
        {tile("Attended", cre.attended)}
        {tile("RCI exam passed", cre.examPassed)}
        {tile("Points credited", cre.pointsCredited)}
      </div>
      <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-green-dark">All participants</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {tile("Registrations", numbers.total, undefined, true)}
        {tile("Payment confirmed", numbers.paymentConfirmed)}
        {tile("Payment pending", numbers.paymentPending, "to check on the desk")}
        {tile("Payment rejected", numbers.paymentRejected)}
        {tile("Not claiming CRE", numbers.others.total, `${numbers.others.paymentConfirmed} paid · ${numbers.others.attended} attended`)}
        {tile("CRE not stated", numbers.notStated, "older registrations")}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        A claimant holds one of the {cre.seats} places from the moment they register; rejecting their payment frees the place for the next
        person. Use the Show filter below to see the people behind these figures.
      </p>
    </section>
  );
}
