import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { MeetingForm } from "@/components/meeting-form";
import { PageBanner } from "@/components/page-banner";
import { adminReady, currentAdmin, deskUser, participantToken, type DeskUser } from "@/lib/admin";
import { mailSetup } from "@/lib/mail";
import { mailsDue } from "@/lib/notify";
import { rciReminderDue } from "@/lib/rci-reminder";
import { afterSessionsOpen, attendanceLabel, deskAccounts, deskCoordinatorLine, isOnlineTrack, onlineProgramme, professionLabel, programme, sourceLabel, type ArrivalSource, type Profession } from "@/lib/programme";
import { docLabels, type DocKind } from "@/lib/proof";
import { paymentState, paymentText, rciState, rciText } from "@/lib/status";
import { deskNumbers, onlineSeatCounts, type DeskNumbers } from "@/lib/seats";
import { creSeatLimit, onlineRegistrationOpen, registrationOpen } from "@/lib/settings";
import { certificateEligible, certificateNumberText, certificatesSwitchOn } from "@/lib/certificates";
import { getDeskPasswordHash, getMeetingUrl, listQueries, listRegistrations, storageMode, type Registration } from "@/lib/store";
import { statusLabel, type VerificationStatus } from "@/lib/verify-types";

export const metadata: Metadata = { title: "Coordinator desk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Tab = "registrations" | "exports" | "bulk" | "queries" | "settings";
type View = "all" | "attention" | "confirmed" | "cre" | "rci-awaited" | "online";

const tabs: { id: Tab; label: string }[] = [
  { id: "registrations", label: "Registrations" },
  { id: "exports", label: "Exports" },
  { id: "bulk", label: "Bulk update" },
  { id: "queries", label: "Queries" },
  { id: "settings", label: "Settings" },
];

const views: { id: View; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "attention", label: "Needs attention" },
  { id: "confirmed", label: "Payment confirmed" },
  { id: "cre", label: "Claiming CRE" },
  { id: "rci-awaited", label: "RCI awaited" },
  { id: "online", label: "Participants, no CRE (offline at YMC)" },
];

/** Automatic-check badge colours. */
const badge: Record<VerificationStatus | "none", string> = {
  verified: "bg-emerald-100 text-emerald-900",
  review: "bg-amber-100 text-amber-900",
  mismatch: "bg-red-100 text-red-800",
  none: "bg-slate-100 text-slate-700",
};

const tone = {
  ok: "bg-emerald-100 text-emerald-900",
  wait: "bg-amber-100 text-amber-900",
  stop: "bg-red-100 text-red-800",
  none: "bg-slate-100 text-slate-700",
} as const;

const chip = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
const smallButton = "inline-flex min-h-9 items-center rounded-full border border-line px-3 text-xs font-semibold";

function needsAttention(row: Registration): boolean {
  return paymentState(row) !== "confirmed" || rciState(row) === "submitted" || (row.creClaim === "" && !isOnlineTrack(row));
}

function inView(row: Registration, view: View): boolean {
  switch (view) {
    case "attention":
      return needsAttention(row);
    case "confirmed":
      return paymentState(row) === "confirmed";
    case "cre":
      return row.creClaim === "yes";
    case "rci-awaited":
      return rciState(row) === "awaited" || rciState(row) === "submitted";
    case "online":
      return isOnlineTrack(row);
    default:
      return true;
  }
}

function deskHref(tab: Tab, params: Record<string, string> = {}): string {
  const search = new URLSearchParams(tab === "registrations" ? params : { tab, ...params });
  const text = search.toString();
  return text ? `/admin?${text}` : "/admin";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; checked?: string; password?: string; bulk?: string; mail?: string; note?: string; q?: string; view?: string }>;
}) {
  const params = await searchParams;
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

  const tab: Tab = tabs.some((item) => item.id === params.tab) ? (params.tab as Tab) : "registrations";
  const view: View = views.some((item) => item.id === params.view) ? (params.view as View) : "all";
  const q = params.q ?? "";

  const [registrations, queries, meeting, passwordsSet, seatLimit, isOpen, certificatesOn, onlineOpen] = await Promise.all([
    listRegistrations(),
    listQueries(),
    getMeetingUrl(),
    Promise.all(deskAccounts.map(async (account) => (await getDeskPasswordHash(account.username)) !== null)),
    creSeatLimit(),
    registrationOpen(),
    certificatesSwitchOn(),
    onlineRegistrationOpen(),
  ]);
  const mail = mailSetup();
  const onlineSeats = onlineSeatCounts(registrations);
  const ownIndex = deskAccounts.findIndex((account) => user.id === `user:${account.username}`);
  const onStartingPassword = ownIndex >= 0 && !passwordsSet[ownIndex];
  const notice = params.note ?? params.mail ?? (params.checked ? `Checked ${params.checked} registration${params.checked === "1" ? "" : "s"} just now.` : undefined);

  return (
    <div className="pb-10">
      <PageBanner kicker="Coordinator desk" title="Registrations and queries" lede={`Signed in as ${user.name}.`} />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link className="inline-flex min-h-11 items-center rounded-full bg-green px-4 text-sm font-semibold text-white" href="/admin/new">
              + Add a registration
            </Link>
            <a className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-semibold" href="/guides/coordinator-desk-guide.pdf" target="_blank" rel="noopener noreferrer">
              Coordinator guide (PDF)
            </a>
            <a className={`${chip} ${isOpen ? tone.ok : tone.stop}`} href={deskHref("settings")}>
              RCI registration {isOpen ? "open" : "closed"}
            </a>
            <a className={`${chip} ${onlineOpen ? tone.ok : tone.stop}`} href={deskHref("settings")}>
              Participant registration {onlineOpen ? `open until ${onlineProgramme.closesLabel}` : "closed"}
            </a>
            <a className={`${chip} ${onlineSeats.left > 0 ? tone.ok : tone.stop}`} href={deskHref("registrations", { view: "online" })} title="Seats held: every participant registration except rejected payments">
              Participant seats {onlineSeats.taken}/{onlineSeats.seats} · offline {onlineSeats.offline} · online {onlineSeats.online}
            </a>
            <a className={`${chip} ${tone.ok}`} href={programme.rciCalendarUrl} target="_blank" rel="noopener noreferrer" title="Open the RCI CRE calendar">
              Approved by RCI · F. No. {programme.rciFileNo} · {programme.rciHours} hours
            </a>
          </div>
          <form action="/api/admin/logout" method="post">
            <button className="min-h-11 rounded-full border border-line bg-card px-4 text-sm font-semibold" type="submit">
              Sign out
            </button>
          </form>
        </div>

        {storageMode() === "local" ? (
          <Alert kind="info">This copy uses a temporary database on the machine running it. The published site keeps registrations in its own store.</Alert>
        ) : null}
        {onStartingPassword ? (
          <Alert kind="warn">
            You are still using the starting password.{" "}
            <a className="font-semibold underline" href={deskHref("settings")}>
              Set your own password
            </a>{" "}
            before the programme.
          </Alert>
        ) : null}
        {mail.state === "wrong-sender" ? (
          <Alert kind="stop">
            Email is switched off: the sender setting (<code>GMAIL_USER</code>) in Vercel is not an email address. Put the Gmail address there, the App Password in{" "}
            <code>GMAIL_APP_PASSWORD</code>, and redeploy.
          </Alert>
        ) : null}
        {mail.state === "no-password" ? (
          <Alert kind="warn">
            Email is switched off: <code>GMAIL_APP_PASSWORD</code> is empty in Vercel. Add a Google App Password and redeploy.
          </Alert>
        ) : null}
        {notice ? <Alert kind="info" status>{notice}</Alert> : null}

        <nav aria-label="Desk sections" className="-mx-4 overflow-x-auto px-4">
          <ul className="flex w-max gap-1 rounded-full bg-card p-1 ring-1 ring-line">
            {tabs.map((item) => {
              const active = item.id === tab;
              const count = item.id === "registrations" ? registrations.length : item.id === "queries" ? queries.length : null;
              return (
                <li key={item.id}>
                  <a
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${
                      active ? "bg-navy text-white" : "text-navy hover:bg-navy/5"
                    }`}
                    href={deskHref(item.id)}
                  >
                    {item.label}
                    {count !== null ? <span className={`text-xs ${active ? "text-white/70" : "text-muted"}`}>{count}</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {tab === "registrations" ? (
          <>
            <Dashboard numbers={deskNumbers(registrations, seatLimit)} />
            <RegistrationsTab registrations={registrations} view={view} q={q} mail={mail} />
          </>
        ) : null}
        {tab === "exports" ? <ExportsTab registrations={registrations} certificatesOn={certificatesOn} mailOn={mail.state === "on"} /> : null}
        {tab === "bulk" ? <BulkTab message={params.bulk} /> : null}
        {tab === "queries" ? <QueriesTab queries={queries} /> : null}
        {tab === "settings" ? (
          <SettingsTab user={user} passwordsSet={passwordsSet} message={params.password} meeting={meeting} mail={mail} seatLimit={seatLimit} isOpen={isOpen} onlineOpen={onlineOpen} />
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

function RegistrationsTab({
  registrations,
  view,
  q,
  mail,
}: {
  registrations: Registration[];
  view: View;
  q: string;
  mail: ReturnType<typeof mailSetup>;
}) {
  const query = q.trim().toLowerCase();
  const shown = registrations.filter((row) => {
    if (query && ![row.reference, row.fullName, row.email, row.mobile, row.crrNumber, row.paymentReference, row.institution].some((value) => value.toLowerCase().includes(query))) {
      return false;
    }
    return inView(row, view);
  });
  const checks = { verified: 0, review: 0, mismatch: 0, none: 0 };
  for (const row of registrations) checks[row.verification?.status ?? "none"] += 1;
  const emailsDue = registrations.filter((row) => mailsDue(row).length > 0).length;
  const rciReminders = registrations.filter(rciReminderDue).length;
  const rciReminded = registrations.filter((row) => row.deskReview?.mailed?.rciReminder).length;

  return (
    <section id="registrations" className="grid gap-4" aria-label="Registrations">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {views.map((item) => {
          const count = registrations.filter((row) => inView(row, item.id)).length;
          const active = item.id === view;
          return (
            <li key={item.id}>
              <a
                aria-current={active ? "true" : undefined}
                className={`grid h-full rounded-2xl bg-card px-4 py-3 ring-1 ${active ? "ring-2 ring-navy" : "ring-line hover:ring-navy/40"}`}
                href={deskHref("registrations", item.id === "all" ? (q ? { q } : {}) : { view: item.id, ...(q ? { q } : {}) })}
              >
                <span className={`font-display text-2xl ${item.id === "attention" && count > 0 ? "text-green" : "text-navy"}`}>{count}</span>
                <span className="text-sm font-semibold text-muted">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-muted">Automatic receipt check:</span>
        {(["verified", "review", "mismatch", "none"] as const).map((key) => (
          <span key={key} className={`${chip} ${badge[key]}`}>
            {statusLabel(key === "none" ? undefined : key)} {checks[key]}
          </span>
        ))}
        {checks.none > 0 ? (
          <form action="/api/admin/verify-pending" method="post">
            <button className="inline-flex min-h-8 items-center rounded-full bg-navy px-3 font-semibold text-white" type="submit">
              Check unchecked (up to 8)
            </button>
          </form>
        ) : null}
      </div>

      {mail.state === "on" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-line">
          <span>
            <strong className="text-navy">Email on</strong> · from {mail.sender}
          </span>
          {emailsDue > 0 ? (
            <form action="/api/admin/mail-pending" method="post">
              <button className="inline-flex min-h-9 items-center rounded-full bg-navy px-3 text-xs font-semibold text-white" type="submit">
                Send pending emails ({emailsDue}, 15 at a time)
              </button>
            </form>
          ) : (
            <span className="text-muted">No emails pending.</span>
          )}
          {rciReminders > 0 ? (
            <form action="/api/admin/rci-reminder" method="post">
              <button className="inline-flex min-h-9 items-center rounded-full bg-[#c2410c] px-3 text-xs font-semibold text-white" type="submit">
                Email RCI registration reminder ({rciReminders} CRE claimant{rciReminders === 1 ? "" : "s"}, 12 at a time)
              </button>
            </form>
          ) : (
            <span className="text-muted">RCI reminder: {rciReminded > 0 ? `sent to ${rciReminded}, none left` : "no CRE claimant is waiting"}.</span>
          )}
        </div>
      ) : null}

      <form className="flex flex-wrap items-end gap-2" action="/admin" method="get" role="search">
        {view !== "all" ? <input type="hidden" name="view" value={view} /> : null}
        <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold text-navy">
          <span className="sr-only">Search registrations</span>
          <input className="field" name="q" defaultValue={q} placeholder="Search name, email, mobile, CRR, payment id, YDU-…" />
        </label>
        <button className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white" type="submit">
          Search
        </button>
        {query || view !== "all" ? (
          <a className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-green underline" href="/admin">
            Clear
          </a>
        ) : null}
      </form>
      <p className="text-sm text-muted">
        Showing {shown.length} of {registrations.length}
        {view !== "all" ? ` · ${views.find((item) => item.id === view)?.label}` : ""}. The automatic check reads receipts, CRR certificates and RCI mails on
        this server. Your own decision always wins and is what the participant sees.
      </p>

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-6 text-center text-muted ring-1 ring-line">
          {registrations.length === 0 ? "No one has registered yet." : "No registrations match."}
        </p>
      ) : (
        <ul className="grid gap-4">
          {shown.map((row) => (
            <li key={row.id}>
              <RegistrationCard row={row} token={participantToken(row.reference)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ExportsTab({ registrations, certificatesOn, mailOn }: { registrations: Registration[]; certificatesOn: boolean; mailOn: boolean }) {
  const downloads = [
    { href: "/api/admin/export/registrations", label: "Registrations (CSV)", note: "Every field, for Excel." },
    { href: "/api/admin/export/rci", label: "RCI list — verified, claiming CRE", note: "Payment confirmed and claiming points." },
    { href: "/api/admin/export/rci?all=1", label: "RCI list — all claiming", note: "Everyone who said they will claim points." },
    { href: "/api/admin/export/queries", label: "Queries (CSV)", note: "Questions sent from the Contact page." },
  ];
  return (
    <div className="grid gap-4">
      <CertificatesPanel registrations={registrations} switchOn={certificatesOn} mailOn={mailOn} />
      <section className="rounded-3xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-2xl text-navy">Participant register</h2>
        <p className="mt-1 text-sm leading-6 text-muted">A4 landscape with the college logo, programme details, the RCI approval (F. No. {programme.rciFileNo}) and the participants you choose.</p>
        <form className="mt-3 grid gap-3 sm:flex sm:flex-wrap sm:items-end" action="/api/admin/export/register" method="get">
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
          <button className="min-h-11 rounded-full bg-green px-5 font-semibold text-white" type="submit">
            Download register
          </button>
        </form>
      </section>
      <section className="rounded-3xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-2xl text-navy">Lists</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {downloads.map((item) => (
            <li key={item.href}>
              <a className="grid h-full rounded-2xl px-4 py-3 ring-1 ring-line hover:ring-navy/40" href={item.href}>
                <span className="font-semibold text-navy">{item.label} ↓</span>
                <span className="text-sm text-muted">{item.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CertificatesPanel({ registrations, switchOn, mailOn }: { registrations: Registration[]; switchOn: boolean; mailOn: boolean }) {
  const dayOpen = afterSessionsOpen();
  const live = switchOn && dayOpen;
  const eligible = registrations.filter(certificateEligible);
  const numbered = eligible.filter((row) => row.deskReview?.certificate).length;
  const onlineEligible = eligible.filter(isOnlineTrack).length;
  const rciEligible = eligible.length - onlineEligible;
  const emailed = eligible.filter((row) => row.deskReview?.mailed?.certificate).length;
  const sample = eligible[0];
  const button = "min-h-11 rounded-full px-5 font-semibold";
  return (
    <section id="certificates" className="scroll-mt-24 rounded-3xl bg-card p-5 ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-navy">E-certificates</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            A Certificate of Participation for everyone whose payment is confirmed, signed by the organising secretaries, the organising chairperson and the
            Principal &amp; Dean, with the college and RCI logos. Each has its own number, printed along the foot.
          </p>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-navy">
            RCI CRE track: carries the RCI logo and the approval — Approved by the Rehabilitation Council of India, letter F. No. {programme.rciFileNo},{" "}
            {programme.level.toLowerCase()} CRE, {programme.rciHours} hours, institute code {programme.instituteCode}.
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            {onlineProgramme.name}: no RCI logo, its own number series ({certificateNumberText(1, true)} onwards) and the line “This certificate does not
            carry RCI CRE points”.
          </p>
        </div>
        <span className={`${chip} ${live ? tone.ok : tone.wait}`}>{live ? "Released to participants" : switchOn ? `Releases on ${programme.dateLabel}` : "Not released"}</span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center sm:max-w-lg">
        {[
          ["Eligible", eligible.length],
          ["Saved", numbered],
          ["Emailed", emailed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-navy/5 px-3 py-2">
            <dt className="text-xs font-semibold text-muted">{label}</dt>
            <dd className="font-display text-2xl text-navy">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form action="/api/admin/certificates" method="post">
          <input type="hidden" name="action" value="save" />
          <button className={`${button} bg-navy text-white disabled:opacity-50`} type="submit" disabled={eligible.length === 0 || numbered >= eligible.length}>
            {numbered >= eligible.length && eligible.length > 0 ? "All certificates saved" : `Save certificates now${eligible.length > numbered ? ` (${eligible.length - numbered})` : ""}`}
          </button>
        </form>
        {sample ? (
          <a className={`${button} inline-flex items-center border border-line`} href={`/api/certificate/${sample.reference}`} target="_blank" rel="noopener noreferrer">
            Preview a certificate
          </a>
        ) : null}
        <form action="/api/admin/certificates" method="post">
          <input type="hidden" name="action" value={switchOn ? "withhold" : "release"} />
          <button className={`${button} ${switchOn ? "border border-line" : "bg-green text-white"} disabled:opacity-50`} type="submit" disabled={!switchOn && !dayOpen}>
            {switchOn ? "Hide downloads" : dayOpen ? "Release certificates" : `Release from ${programme.day} ${programme.month}`}
          </button>
        </form>
        <form action="/api/admin/certificates" method="post">
          <input type="hidden" name="action" value="email" />
          <button className={`${button} bg-navy text-white disabled:opacity-50`} type="submit" disabled={!live || !mailOn || emailed >= eligible.length}>
            Email certificates{live && eligible.length > emailed ? ` (${eligible.length - emailed} to send)` : ""}
          </button>
        </form>
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl bg-navy/5 p-4">
        <h3 className="font-semibold text-navy">For e-signatures — PowerPoint</h3>
        <p className="text-sm leading-6 text-muted">
          One A4 slide per participant, in certificate-number order. Open in PowerPoint → <strong>View → Slide Master</strong> → click the top (master) slide →{" "}
          <strong>Insert → Pictures</strong> and place each signature (transparent PNG) just above its line: it then appears on every certificate in the file. Close
          the master view, check a few slides, then <strong>File → Save As → PDF</strong>. Names and workplaces are editable text boxes; the reference and email of
          each participant are in the slide notes.
        </p>
        <p className="flex flex-wrap gap-4 text-sm font-semibold">
          <a className={`text-green underline ${rciEligible === 0 ? "pointer-events-none opacity-50" : ""}`} href="/api/admin/export/certificates-pptx?track=rci">
            RCI CRE certificates — PowerPoint ({rciEligible}) ↓
          </a>
          <a className={`text-green underline ${onlineEligible === 0 ? "pointer-events-none opacity-50" : ""}`} href="/api/admin/export/certificates-pptx?track=online">
            Participant certificates (no CRE) — PowerPoint ({onlineEligible}) ↓
          </a>
        </p>
        <p className="flex flex-wrap gap-4 text-sm font-semibold">
          <a className="text-green underline" href="/api/admin/export/certificates">
            All — digital PDFs (ZIP)
          </a>
          <a className="text-green underline" href="/api/admin/export/certificates?edition=print">
            All — print edition PDFs (ZIP)
          </a>
        </p>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        “Save certificates now” gives everyone eligible a fixed number in order of registration ({certificateNumberText(1)} onwards; {certificateNumberText(1, true)} for the
        participant registrations) and dates every certificate {programme.dateLabel.replace(/^\w+, /, "")}. Participants can download only after “Release certificates” on the programme day.
        People confirmed later get the next number — export again to include them. Emails go out about a dozen at a time — press again until done.
      </p>
      <div className="mt-5 border-t border-line pt-4">
        <h3 className="font-semibold text-navy">Resource persons — Certificates of Appreciation</h3>
        <p className="mt-1 text-sm leading-6 text-muted">One page for each speaker, in session order, with the RCI logo and approval letter number. Print the print edition on A4 certificate card at actual size and sign in ink.</p>
        <p className="mt-2 flex flex-wrap gap-4 text-sm font-semibold">
          <a className="text-green underline" href="/api/admin/export/resource-certificates?edition=print">
            Print edition (PDF)
          </a>
          <a className="text-green underline" href="/api/admin/export/resource-certificates?edition=digital">
            Digital edition (PDF)
          </a>
        </p>
      </div>
    </section>
  );
}

function BulkTab({ message }: { message: string | undefined }) {
  const dayOpen = afterSessionsOpen();
  return (
    <section id="bulk" className="rounded-3xl bg-card p-5 ring-1 ring-line">
      <h2 className="font-display text-2xl text-navy">Bulk update</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Paste emails, CRR numbers or YDU- references — one per line, or copied straight from the Webex attendance report or a list from RCI. Every matching
        participant gets the decision you choose, recorded with your name.
        {dayOpen ? "" : ` Webex attendance, the RCI exam and CRE points open on ${programme.dateLabel} — enter them for everyone at once from the Webex attendance report.`}
      </p>
      {message ? (
        <p className="mt-3 rounded-2xl bg-navy/5 px-4 py-3 text-sm font-semibold text-navy" role="status">
          {message}
        </p>
      ) : null}
      <form className="mt-3 grid gap-3" action="/api/admin/bulk" method="post">
        <textarea className="field min-h-36 font-mono text-xs" name="list" required placeholder={"name@example.com\nA81760\nYDU-…"} />
        <label className="grid gap-1 text-sm font-semibold text-navy sm:max-w-sm">
          Mark them as
          <select className="field" name="action" defaultValue={dayOpen ? "att-attended" : "rci-confirmed"}>
            <option value="att-attended" disabled={!dayOpen}>Attended on Webex{dayOpen ? "" : ` (from ${programme.day} ${programme.month})`}</option>
            <option value="exam-passed" disabled={!dayOpen}>RCI online exam — passed</option>
            <option value="exam-not-passed" disabled={!dayOpen}>RCI online exam — not passed</option>
            <option value="pts-credited" disabled={!dayOpen}>CRE points credited on RCI profile</option>
            <option value="rci-confirmed">RCI registration confirmed</option>
            <option value="pay-verified">Payment verified</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input className="mt-1 size-4" type="checkbox" name="checked" value="yes" />
          <span>
            I checked these payments myself (needed only for <strong>Payment verified</strong>).
          </span>
        </label>
        <button className="min-h-11 justify-self-start rounded-full bg-navy px-5 font-semibold text-white" type="submit">
          Apply
        </button>
      </form>
    </section>
  );
}

function QueriesTab({ queries }: { queries: Awaited<ReturnType<typeof listQueries>> }) {
  return (
    <section aria-label="Queries">
      {queries.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-6 text-center text-muted ring-1 ring-line">No queries yet.</p>
      ) : (
        <ul className="grid gap-3">
          {queries.map((query) => (
            <li key={query.id} className="rounded-3xl bg-card p-4 ring-1 ring-line">
              <p className="font-semibold text-navy">{query.topic}</p>
              <p className="text-sm text-muted">
                {query.fullName} ·{" "}
                <a className="text-green underline" href={`mailto:${query.email}?subject=${encodeURIComponent(`${programme.title} — ${query.topic}`)}`}>
                  {query.email}
                </a>{" "}
                · {new Date(query.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
              </p>
              <p className="mt-2 leading-7">{query.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SettingsTab({
  passwordsSet,
  message,
  meeting,
  mail,
  seatLimit,
  isOpen,
  onlineOpen,
}: {
  user: DeskUser;
  passwordsSet: boolean[];
  message: string | undefined;
  meeting: string | null;
  mail: ReturnType<typeof mailSetup>;
  seatLimit: number;
  isOpen: boolean;
  onlineOpen: boolean;
}) {
  return (
    <div className="grid gap-4">
      <section id="switches" className="rounded-3xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-2xl text-navy">Site switches</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Apply on the website at once. CRE places are first registered, first served; places given from the desk beyond the limit are allowed and counted.
        </p>
        <form className="mt-3 grid gap-3 sm:flex sm:flex-wrap sm:items-end" action="/api/admin/settings" method="post">
          <label className="grid gap-1 text-sm font-semibold text-navy">
            RCI CRE places
            <input className="field w-28" name="creSeats" type="number" min={0} max={2000} defaultValue={seatLimit} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-navy">
            RCI CRE registration
            <select className="field" name="registrationOpen" defaultValue={isOpen ? "yes" : "no"}>
              <option value="yes">Open</option>
              <option value="no">Closed</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-navy">
            Participant registration (offline at YMC)
            <select className="field" name="onlineRegistrationOpen" defaultValue={onlineOpen ? "yes" : "no"}>
              <option value="yes">Open (until {onlineProgramme.closesLabel})</option>
              <option value="no">Closed</option>
            </select>
          </label>
          <button className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white" type="submit">
            Save switches
          </button>
        </form>
      </section>
      <section id="accounts" className="rounded-3xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-2xl text-navy">Coordinator accounts</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Each coordinator signs in with her username and her own password (10 characters or more). Passwords are stored only as a scrambled hash.
           Any coordinator can set or reset any of these passwords — for example, when someone forgets hers.
        </p>
        {message ? (
          <p className="mt-3 rounded-2xl bg-navy/5 px-4 py-3 text-sm font-semibold text-navy" role="status">
            {message}
          </p>
        ) : null}
        <ul className="mt-3 grid gap-4">
          {deskAccounts.map((account, index) =>
            (
              <li key={account.username}>
                <form className="grid gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-3" action="/api/admin/password" method="post">
                  <input type="hidden" name="username" value={account.username} />
                  <p className="text-sm sm:min-w-[14rem]">
                    <span className="font-semibold text-navy">{account.name}</span>
                    <span className="block text-muted">
                      Username <code>{account.username}</code> ·{" "}
                      {passwordsSet[index] ? "own password set" : <strong className="text-green">starting password — please change it</strong>}
                    </span>
                  </p>
                  <label className="grid gap-1 text-sm font-semibold text-navy">
                    New password
                    <input className="field" name="password" type="password" minLength={10} autoComplete="new-password" required />
                  </label>
                  <button className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white" type="submit">
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
        <p className="mt-1 text-sm leading-6 text-muted">Only an https address on webex.com is accepted. The Join and RCI attend pages use it immediately.</p>
        <div className="mt-4 max-w-xl">
          <MeetingForm current={meeting} />
        </div>
      </section>
      <section className="rounded-3xl bg-card p-5 ring-1 ring-line">
        <h2 className="font-display text-2xl text-navy">Confirmation emails</h2>
        <p className="mt-1 text-sm leading-6">
          {mail.state === "on" ? (
            <>
              <strong className="text-navy">On.</strong> Sent from {mail.sender}; copies stay in its Sent folder. Replies go to {programme.email}.
            </>
          ) : mail.state === "off" ? (
            <>
              <strong className="text-navy">Off.</strong> Add <code>GMAIL_USER</code> (the Gmail address) and <code>GMAIL_APP_PASSWORD</code> (a Google App
              Password) in Vercel → Settings → Environment Variables, then redeploy.
            </>
          ) : mail.state === "wrong-sender" ? (
            <>
              <strong className="text-red-800">Off — setting wrong.</strong> <code>GMAIL_USER</code> must be the Gmail address itself.
            </>
          ) : (
            <>
              <strong className="text-red-800">Off — password missing.</strong> <code>GMAIL_APP_PASSWORD</code> is empty.
            </>
          )}
        </p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One registration                                                    */
/* ------------------------------------------------------------------ */

function RegistrationCard({ row, token }: { row: Registration; token: string | null }) {
  const statusLink = token ? `/status/${row.reference}?t=${encodeURIComponent(token)}` : "";
  const pay = paymentState(row);
  const rci = rciState(row);
  const whatsapp = `https://wa.me/91${row.mobile}?text=${encodeURIComponent(
    `Dear ${row.title ? `${row.title} ` : ""}${row.fullName}, this is the ${programme.title} CRE desk (${row.reference}). ${paymentText[pay]}.${
      row.creClaim === "yes" ? ` ${rciText[rci]}.` : ""
    }`,
  )}`;
  const status = row.verification?.status;
  const files: DocKind[] = [...row.documents];
  if (row.paymentProof !== "" && !files.includes("payment")) files.unshift("payment");
  const payDecision = row.deskReview?.payment;
  const mailed = [row.deskReview?.mailed?.registration ? "registration" : "", row.deskReview?.mailed?.payment ? "payment" : "", row.deskReview?.mailed?.rci ? "RCI" : "", row.deskReview?.mailed?.certificate ? "certificate" : ""]
    .filter(Boolean)
    .join(", ");

  return (
    <article id={row.reference} className="scroll-mt-24 rounded-3xl bg-card p-4 ring-1 ring-line sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-navy">
            {row.title ? `${row.title} ` : ""}
            {row.fullName}
          </h3>
          <p className="mt-1 flex flex-wrap gap-1.5">
            <span className={`${chip} ${pay === "confirmed" ? tone.ok : pay === "rejected" ? tone.stop : tone.wait}`}>
              {pay === "confirmed" ? "Paid" : pay === "rejected" ? "Payment rejected" : "Payment pending"}
            </span>
            {row.creClaim === "yes" ? (
              <span className={`${chip} ${rci === "confirmed" ? tone.ok : rci === "rejected" ? tone.stop : tone.wait}`}>
                CRE · {rci === "confirmed" ? "RCI confirmed" : rci === "rejected" ? "RCI rejected" : rci === "submitted" ? "RCI to review" : "RCI awaited"}
              </span>
            ) : isOnlineTrack(row) ? (
              <span className={`${chip} bg-teal-100 text-teal-900`}>Participant · no CRE · {attendanceLabel(row.attendance) || "attendance not stated"}</span>
            ) : (
              <span className={`${chip} ${row.creClaim === "" ? tone.wait : tone.none}`}>{row.creClaim === "no" ? "Not claiming CRE" : "CRE not stated"}</span>
            )}
            {payDecision?.decision === "verified" && payDecision.override ? <span className={`${chip} ${tone.wait}`}>Paid by override</span> : null}
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <p className="font-mono text-sm font-semibold text-ink">{row.reference}</p>
          <p>{new Date(row.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</p>
          <p>{sourceLabel(row.source as ArrivalSource)}</p>
        </div>
      </header>

      <div className="mt-2 text-sm">
        <p className="break-all text-muted">
          <a className="text-ink underline decoration-line" href={`mailto:${row.email}?subject=${encodeURIComponent(`${programme.title} — ${row.reference}`)}`}>
            {row.email}
          </a>{" "}
          ·{" "}
          <a className="text-ink underline decoration-line" href={`tel:+91${row.mobile}`}>
            {row.mobile}
          </a>
        </p>
        <p className="text-muted">
          {professionLabel(row.profession as Profession)}
          {row.professionDetail ? ` · ${row.professionDetail}` : ""}
          {row.institution ? ` · ${row.institution}` : ""}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold">
          <Link className="rounded-full bg-navy px-2.5 py-1 text-white" href={`/admin/edit/${row.reference}`}>
            Edit / control
          </Link>
          <a className="text-green underline" href={whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          {statusLink ? (
            <a className="text-green underline" href={statusLink} target="_blank" rel="noopener noreferrer">
              Status / PDF
            </a>
          ) : null}
          {certificateEligible(row) ? (
            <a className="text-green underline" href={`/api/certificate/${row.reference}`} target="_blank" rel="noopener noreferrer">
              Certificate{row.deskReview?.certificate ? ` ${String(row.deskReview.certificate.number).padStart(4, "0")}` : ""}
            </a>
          ) : null}
          {files.map((kind) => (
            <a key={kind} className="text-green underline" href={`/api/admin/file/${row.reference}/${kind}`} target="_blank" rel="noopener noreferrer">
              {docLabels[kind]}
            </a>
          ))}
          {files.length === 0 ? <span className="text-muted">No files uploaded</span> : null}
        </p>
        {row.accessNeeds ? <p className="mt-1 text-xs text-muted">Access needs: {row.accessNeeds}</p> : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Panel title="Payment">
          <p className="break-all font-mono text-xs">{row.paymentReference || "No payment id"}</p>
          <p className="mt-1">
            <span className={`${chip} ${badge[status ?? "none"]}`}>Auto: {statusLabel(status)}</span>
          </p>
          {row.verification ? <p className="mt-1 text-xs leading-5 text-muted">{row.verification.summary}</p> : null}
          <p className={`mt-2 text-xs font-semibold ${pay === "confirmed" ? "text-emerald-800" : "text-navy"}`}>
            Participant sees: {paymentText[pay]}
            {payDecision ? ` (by ${payDecision.by}${payDecision.override ? ", overriding the automatic check" : ""})` : ""}
          </p>
          <PaymentButtons row={row} />
          {row.verification ? (
            <details className="mt-2 text-xs leading-5">
              <summary className="cursor-pointer font-semibold text-navy">What the check found</summary>
              <ul className="mt-1 grid gap-1">
                {row.verification.checks.map((check) => (
                  <li key={check.label}>
                    <span className={check.result === "pass" ? "text-emerald-800" : check.result === "fail" ? "text-red-700" : "text-navy"}>
                      {check.result === "pass" ? "✓" : check.result === "fail" ? "✗" : "!"} {check.label}
                    </span>
                    <span className="block text-muted">{check.note}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-muted">Checked {new Date(row.verification.checkedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
            </details>
          ) : null}
          <form action={`/api/admin/verify/${row.reference}`} method="post" className="mt-2">
            <button className={smallButton} type="submit">
              {row.verification ? "Run check again" : "Run check now"}
            </button>
          </form>
        </Panel>

        <Panel title="RCI CRE points">
          <p>
            {row.creClaim === "yes" ? "Claiming" : row.creClaim === "no" ? "Not claiming" : "Not stated"}
            {row.crrNumber && row.crrNumber !== "Not applicable" ? <span className="font-mono font-semibold"> · {row.crrNumber}</span> : null}
          </p>
          {row.creClaim === "yes" ? (
            <>
              <p className={`mt-1 text-xs font-semibold ${rci === "confirmed" ? "text-emerald-800" : "text-navy"}`}>
                {rciText[rci]}
                {row.deskReview?.rci ? ` (by ${row.deskReview.rci.by})` : ""}
              </p>
              <DecisionButtons reference={row.reference} prefix="rci" yes="confirmed" yesLabel="RCI confirmed" set={row.deskReview?.rci?.decision} />
            </>
          ) : null}
          {row.creClaim === "" ? (
            <form action={`/api/admin/review/${row.reference}`} method="post" className="mt-2 grid gap-1">
              <p className="text-xs text-muted">Ask the participant, then record the answer:</p>
              <div className="flex flex-wrap gap-1">
                {/^[AB]\d{3,8}$/.test(row.crrNumber) ? (
                  <button className={smallButton} name="action" value="cre-yes" type="submit">
                    Claiming
                  </button>
                ) : null}
                <button className={smallButton} name="action" value="cre-no" type="submit">
                  Not claiming
                </button>
              </div>
            </form>
          ) : null}
        </Panel>

        <Panel title="On the day and after">
          <Journey row={row} />
        </Panel>
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted">Emailed: {mailed || "none yet"}</span>
          <form action={`/api/admin/mail/${row.reference}`} method="post">
            <button className={smallButton} type="submit">
              Resend confirmation
            </button>
          </form>
          {row.deskReview?.certificate ? (
            <form action="/api/admin/certificates" method="post">
              <input type="hidden" name="action" value="resend" />
              <input type="hidden" name="reference" value={row.reference} />
              <button className={smallButton} type="submit">
                {row.deskReview.mailed?.certificate ? "Resend certificate" : "Email certificate"}
              </button>
            </form>
          ) : null}
        </div>
        <details className="text-right">
          <summary className="cursor-pointer font-semibold text-red-800">Delete registration</summary>
          <form action={`/api/admin/delete/${row.reference}`} method="post" className="mt-2 grid justify-items-end gap-2">
            <label className="grid gap-1 text-left">
              <span>
                This removes the participant and their files for good. Type <strong className="font-mono">{row.reference}</strong> to confirm.
              </span>
              <input className="field font-mono" name="confirm" autoComplete="off" required />
            </label>
            <button className="inline-flex min-h-9 items-center rounded-full bg-red-700 px-3 font-semibold text-white" type="submit">
              Delete for good
            </button>
          </form>
        </details>
      </footer>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-paper p-3 text-sm">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h4>
      {children}
    </section>
  );
}

/**
 * Mark verified / Reject / Undo for the payment. When the automatic check has not passed, verifying needs
 * a tick to say the coordinator checked the payment herself (the server enforces this too).
 */
function PaymentButtons({ row }: { row: Registration }) {
  const set = row.deskReview?.payment?.decision;
  const override = row.verification?.status !== "verified";
  return (
    <div className="mt-2 grid gap-2">
      {set !== "verified" ? (
        <form action={`/api/admin/review/${row.reference}`} method="post" className="grid gap-1">
          {override ? (
            <label className="flex items-start gap-2 text-xs">
              <input className="mt-0.5 size-4" type="checkbox" name="checked" value="yes" required />
              <span>I checked this payment myself (Razorpay or bank statement).</span>
            </label>
          ) : null}
          <button className="inline-flex min-h-9 items-center justify-self-start rounded-full bg-emerald-700 px-3 text-xs font-semibold text-white" name="action" value="pay-verified" type="submit">
            {override ? "Mark verified anyway" : "Mark verified"}
          </button>
        </form>
      ) : null}
      <form action={`/api/admin/review/${row.reference}`} method="post" className="flex flex-wrap gap-1">
        {set !== "rejected" ? (
          <button className="inline-flex min-h-9 items-center rounded-full border border-red-300 px-3 text-xs font-semibold text-red-800" name="action" value="pay-rejected" type="submit">
            Reject
          </button>
        ) : null}
        {set ? (
          <button className={smallButton} name="action" value="pay-clear" type="submit">
            Undo
          </button>
        ) : null}
      </form>
    </div>
  );
}

function DecisionButtons({ reference, prefix, yes, yesLabel, set }: { reference: string; prefix: "rci"; yes: string; yesLabel: string; set: string | undefined }) {
  return (
    <form action={`/api/admin/review/${reference}`} method="post" className="mt-2 flex flex-wrap gap-1">
      {set !== yes ? (
        <button className="inline-flex min-h-9 items-center rounded-full bg-emerald-700 px-3 text-xs font-semibold text-white" name="action" value={`${prefix}-${yes}`} type="submit">
          {yesLabel}
        </button>
      ) : null}
      {set !== "rejected" ? (
        <button className="inline-flex min-h-9 items-center rounded-full border border-red-300 px-3 text-xs font-semibold text-red-800" name="action" value={`${prefix}-rejected`} type="submit">
          Reject
        </button>
      ) : null}
      {set ? (
        <button className={smallButton} name="action" value={`${prefix}-clear`} type="submit">
          Undo
        </button>
      ) : null}
    </form>
  );
}

function Journey({ row }: { row: Registration }) {
  const review = row.deskReview ?? {};
  const dayOpen = afterSessionsOpen();
  const item = (label: string, value: string | undefined, by: string | undefined) => (
    <p className="text-xs">
      <span className="font-semibold text-navy">{label}:</span> {value ?? "—"}
      {by ? <span className="text-muted"> ({by})</span> : null}
    </p>
  );
  const button = (action: string, label: string) => (
    <button key={action} className={smallButton} name="action" value={action} type="submit">
      {label}
    </button>
  );
  return (
    <div className="grid gap-1">
      {item("Webex", review.attendance?.decision, review.attendance?.by)}
      {row.creClaim === "yes" ? item("RCI exam", review.exam?.decision.replace("-", " "), review.exam?.by) : null}
      {row.creClaim === "yes" ? item("Points", review.points ? "credited" : undefined, review.points?.by) : null}
      {dayOpen ? (
        <form action={`/api/admin/review/${row.reference}`} method="post" className="mt-1 flex flex-wrap gap-1">
          {review.attendance?.decision !== "attended" ? button("att-attended", "Attended") : button("att-clear", "Undo attended")}
          {row.creClaim === "yes" ? (
            <>
              {review.exam ? button("exam-clear", "Undo exam") : [button("exam-passed", "Exam passed"), button("exam-not-passed", "Not passed")]}
              {review.points ? button("pts-clear", "Undo points") : button("pts-credited", "Points credited")}
            </>
          ) : null}
        </form>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted">Entered from {programme.dateLabel}, for everyone at once under Bulk update.</p>
          {review.attendance || review.exam || review.points ? (
            <form action={`/api/admin/review/${row.reference}`} method="post" className="mt-1 flex flex-wrap gap-1">
              {review.attendance ? button("att-clear", "Clear early attendance mark") : null}
              {review.exam ? button("exam-clear", "Clear exam mark") : null}
              {review.points ? button("pts-clear", "Clear points mark") : null}
            </form>
          ) : null}
        </>
      )}
    </div>
  );
}

function Alert({ kind, status, children }: { kind: "info" | "warn" | "stop"; status?: boolean; children: React.ReactNode }) {
  const style = kind === "stop" ? "bg-red-50 text-red-900 ring-red-200" : kind === "warn" ? "bg-amber-50 text-amber-950 ring-amber-200" : "bg-navy/5 text-navy ring-line";
  return (
    <p className={`rounded-2xl px-4 py-3 text-sm leading-6 ring-1 ${style}`} role={status ? "status" : undefined}>
      {children}
    </p>
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
