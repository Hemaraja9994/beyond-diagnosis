import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { certificateMailDue, mailCertificate } from "@/lib/certificate-mail";
import { certificatesReleased, numberAllEligible, setCertificatesReleased } from "@/lib/certificates";
import { json } from "@/lib/http";
import { mailReady } from "@/lib/mail";
import { afterSessionsOpen, programme } from "@/lib/programme";
import { getRegistration, listRegistrations } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const batch = 12;

/**
 * Desk actions for e-certificates:
 *  save     – numbers every eligible certificate now (any day), for export and e-signatures; not visible to participants
 *  release  – participants can download from their status page (from the programme day); numbers are given in registration order
 *  withhold – hides the download again (numbers already given stay)
 *  email    – emails the next batch of participants who have not had theirs
 *  resend   – emails one participant again (reference=YDU-…)
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const form = await request.formData().catch(() => null);
  const action = String(form?.get("action") ?? "");
  const back = (message: string) => Response.redirect(new URL(`/admin?tab=exports&note=${encodeURIComponent(message)}#certificates`, request.url), 303);
  const origin = new URL(request.url).origin;

  if (action === "save") {
    // Saving gives every eligible participant a fixed number now, so the desk can export and e-sign the
    // certificates before the programme. Participants still download only after release.
    const numbered = await numberAllEligible(await listRegistrations());
    console.log(`desk: certificates saved by ${user.name}; ${numbered} newly numbered`);
    return back(
      numbered
        ? `Saved by ${user.name}: ${numbered} certificate${numbered === 1 ? "" : "s"} numbered and ready to export for e-signatures.`
        : "All eligible certificates were already saved.",
    );
  }
  if (action === "release") {
    if (!afterSessionsOpen()) return back(`Certificates can be released from ${programme.dateLabel}.`);
    const numbered = await numberAllEligible(await listRegistrations());
    await setCertificatesReleased(true);
    console.log(`desk: certificates released by ${user.name}; ${numbered} newly numbered`);
    return back(`Released by ${user.name}. Participants with confirmed payment can now download their certificate${numbered ? `; ${numbered} numbered just now` : ""}.`);
  }
  if (action === "withhold") {
    await setCertificatesReleased(false);
    console.log(`desk: certificates withheld by ${user.name}`);
    return back(`Downloads hidden by ${user.name}. Certificate numbers already given are kept.`);
  }
  if (action === "email" || action === "resend") {
    if (!mailReady()) return back("Email is not set up yet.");
    if (!(await certificatesReleased())) return back("Release certificates first.");
    if (action === "resend") {
      const reference = String(form?.get("reference") ?? "").toUpperCase();
      const row = /^YDU-[A-Z2-9]{12}$/.test(reference) ? await getRegistration(reference) : null;
      if (!row) return back("That registration was not found.");
      const ok = await mailCertificate(reference, origin, true);
      return back(ok ? `Certificate emailed again to ${row.fullName}.` : `Could not email ${row.fullName}'s certificate (payment confirmed?).`);
    }
    const due = (await listRegistrations()).filter(certificateMailDue).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    let sent = 0;
    for (const row of due.slice(0, batch)) if (await mailCertificate(row.reference, origin).catch(() => false)) sent += 1;
    const left = due.length - sent;
    return back(`Emailed ${sent} certificate${sent === 1 ? "" : "s"}.${left > 0 ? ` ${left} still to send — press "Email certificates" again.` : " All certificates have been emailed."}`);
  }
  return back("Choose an action.");
}
