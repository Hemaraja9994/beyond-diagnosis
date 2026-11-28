import { participantToken } from "@/lib/admin";
import { acknowledgementPdf } from "@/lib/acknowledgement";
import { mailReady, sendMail } from "@/lib/mail";
import { attendanceLabel, attendanceWhere, isOnlineTrack, onlineProgramme, programme } from "@/lib/programme";
import { creStamp, participationStamp, paymentState, paymentText, rciState, rciText } from "@/lib/status";
import { getRegistration, saveDeskReview, type Registration } from "@/lib/store";

/**
 * Confirmation emails, each sent once:
 *  registration – right after registering (acknowledgement PDF attached)
 *  payment      – when the payment is confirmed (automatically or by a coordinator)
 *  rci          – when the RCI confirmation is accepted
 * If the registration mail goes out after the payment is already confirmed, it says so and counts for both.
 */
type Kind = "registration" | "payment" | "rci";

export async function notifyParticipant(reference: string, origin: string, force?: "registration"): Promise<Kind[]> {
  if (!mailReady()) return [];
  const row = await getRegistration(reference);
  if (!row) return [];
  const mailed = { ...(row.deskReview?.mailed ?? {}) };
  const sent: Kind[] = [];
  const now = new Date().toISOString();
  const links = statusLinks(row.reference, origin);

  if (force === "registration" || !mailed.registration) {
    const ok = await registrationMail(row, links);
    if (ok) {
      mailed.registration = now;
      sent.push("registration");
      if (paymentState(row) === "confirmed") mailed.payment ??= now;
      if (rciState(row) === "confirmed") mailed.rci ??= now;
    }
  }
  if (paymentState(row) === "confirmed" && !mailed.payment) {
    if (await simpleMail(row, links, "Payment confirmed", `Your payment of ${programme.feeLabel} for ${programme.title} is confirmed.`)) {
      mailed.payment = now;
      sent.push("payment");
    }
  }
  if (rciState(row) === "confirmed" && !mailed.rci) {
    if (
      await simpleMail(
        row,
        links,
        "RCI registration confirmed",
        "Your RCI portal registration for this programme has been received and matched to your registration. After the sessions, the online examination is conducted by RCI, and CRE points are credited to your profile on the RCI website.",
      )
    ) {
      mailed.rci = now;
      sent.push("rci");
    }
  }
  if (sent.length > 0) {
    const fresh = await getRegistration(reference);
    await saveDeskReview(reference, { ...(fresh?.deskReview ?? {}), mailed });
  }
  return sent;
}

/** Which of a participant's emails are still due. */
export function mailsDue(row: Registration): Kind[] {
  const mailed = row.deskReview?.mailed ?? {};
  const due: Kind[] = [];
  if (!mailed.registration) due.push("registration");
  else {
    if (paymentState(row) === "confirmed" && !mailed.payment) due.push("payment");
    if (rciState(row) === "confirmed" && !mailed.rci) due.push("rci");
  }
  return due;
}

type Links = { status: string | null };

function statusLinks(reference: string, origin: string): Links {
  const token = participantToken(reference);
  return { status: token ? `${origin}/status/${reference}?t=${encodeURIComponent(token)}` : null };
}

async function registrationMail(row: Registration, links: Links): Promise<boolean> {
  const name = `${row.title ? `${row.title} ` : ""}${row.fullName}`;
  const first = participationStamp(row);
  const second = creStamp(row);
  const lines = [
    `Registration reference: ${row.reference}`,
    `Payment: ${paymentText[paymentState(row)]}`,
    isOnlineTrack(row) ? `Registration: ${onlineProgramme.name}. ${onlineProgramme.noCreLine}` : `RCI CRE points: ${rciText[rciState(row)]}`,
    isOnlineTrack(row) && row.attendance ? `Attendance: ${attendanceLabel(row.attendance)}` : "",
  ].filter(Boolean);
  const attachments = links.status
    ? [{ filename: `Acknowledgement-${row.reference}.pdf`, content: Buffer.from(await acknowledgementPdf(row, links.status)), contentType: "application/pdf" }]
    : [];
  const result = await sendMail({
    to: row.email,
    subject: `Registration received — ${programme.title} (${row.reference})`,
    text: [
      `Dear ${name},`,
      "",
      `Thank you for registering for ${programme.title}: ${programme.subtitle}, ${programme.dateLabel}, from ${programme.start}, ${attendanceWhere(row)}.`,
      "",
      ...lines,
      "",
      `Join the participants' WhatsApp group: ${programme.whatsappUrl}`,
      links.status ? `Your status page: ${links.status}` : "",
      row.creClaim === "yes"
        ? `Claiming CRE points: register for this programme on the RCI website too (${programme.rciCalendarUrl}), then upload RCI's confirmation mail on the site (Add RCI confirmation).`
        : "",
      "",
      "Your acknowledgement is attached.",
      "",
      `${programme.organiser}, ${programme.university}`,
      programme.email,
    ]
      .filter((line, index, all) => line !== "" || all[index - 1] !== "")
      .join("\n"),
    html: shell(
      `<p>Dear ${esc(name)},</p>
       <p>Thank you for registering for <strong>${esc(programme.title)}</strong>: ${esc(programme.subtitle)} — ${esc(programme.dateLabel)}, from ${esc(programme.start)}, ${esc(attendanceWhere(row))}.</p>
       <table style="border-collapse:collapse;margin:12px 0">${[
         ["Reference", row.reference],
         ["Participation", `${first.word.toLowerCase()}`],
         ["Payment", paymentText[paymentState(row)]],
         isOnlineTrack(row) ? ["Registration", `${onlineProgramme.name} · no CRE points`] : ["RCI CRE points", rciText[rciState(row)]],
         ...(isOnlineTrack(row) && row.attendance ? [["Attendance", attendanceLabel(row.attendance)]] : []),
       ]
         .map(([label, value]) => `<tr><td style="padding:4px 14px 4px 0;color:#5c6678">${esc(label)}</td><td style="padding:4px 0;font-weight:600">${esc(value)}</td></tr>`)
         .join("")}</table>
       <p>${button(programme.whatsappUrl, "Join the participants' WhatsApp group")}</p>
       ${links.status ? `<p>${button(links.status, "Open my status page", true)}</p>` : ""}
       ${
         row.creClaim === "yes"
           ? `<p style="color:#5c6678">Claiming CRE points: register for this programme on the <a href="${esc(programme.rciCalendarUrl)}" style="color:#0f214a">RCI website</a> too, then upload RCI's confirmation mail on the site under <em>Add RCI confirmation</em>. Status of RCI CRE: ${esc(second.word.toLowerCase())}.</p>`
           : ""
       }
       <p>Your acknowledgement is attached as a PDF.</p>`,
    ),
    attachments,
  });
  return result.sent;
}

async function simpleMail(row: Registration, links: Links, heading: string, message: string): Promise<boolean> {
  const name = `${row.title ? `${row.title} ` : ""}${row.fullName}`;
  const result = await sendMail({
    to: row.email,
    subject: `${heading} — ${programme.title} (${row.reference})`,
    text: [`Dear ${name},`, "", message, "", `Reference: ${row.reference}`, links.status ? `Status and acknowledgement: ${links.status}` : "", `WhatsApp group: ${programme.whatsappUrl}`, "", `${programme.organiser}, ${programme.university}`].join("\n"),
    html: shell(
      `<p>Dear ${esc(name)},</p><p><strong>${esc(heading)}.</strong> ${esc(message)}</p><p style="color:#5c6678">Reference: ${esc(row.reference)}</p>
       ${links.status ? `<p>${button(links.status, "Status and acknowledgement")}</p>` : ""}
       <p>${button(programme.whatsappUrl, "Participants' WhatsApp group", true)}</p>`,
    ),
  });
  return result.sent;
}

export function shell(body: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0f214a;max-width:560px">
    <p style="margin:0 0 4px;font-weight:700">${esc(programme.organiser)}</p>
    <p style="margin:0 0 16px;color:#5c6678;font-size:13px">${esc(programme.hospital)}, ${esc(programme.university)}</p>
    <div style="border-top:3px solid #e4570b;padding-top:12px">${body}</div>
    <p style="margin-top:24px;color:#5c6678;font-size:13px">${esc(programme.title)} · Approved by RCI, F. No. ${esc(programme.rciFileNo)}<br>Questions: reply to this mail or write to ${esc(programme.email)}</p>
  </div>`;
}

export function button(href: string, label: string, quiet = false): string {
  const style = quiet
    ? "display:inline-block;padding:9px 16px;border:2px solid #0f214a;border-radius:999px;color:#0f214a;text-decoration:none;font-weight:700"
    : "display:inline-block;padding:10px 18px;background:#e4570b;border-radius:999px;color:#ffffff;text-decoration:none;font-weight:700";
  return `<a href="${esc(href)}" style="${style}">${esc(label)}</a>`;
}

export function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
