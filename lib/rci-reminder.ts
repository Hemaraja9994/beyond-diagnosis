import { participantToken } from "@/lib/admin";
import { mailReady, sendMail } from "@/lib/mail";
import { button, esc, shell } from "@/lib/notify";
import { programme } from "@/lib/programme";
import { paymentState, rciState } from "@/lib/status";
import { getRegistration, saveDeskReview, type Registration } from "@/lib/store";

/**
 * Reminder to CRE claimants: RCI has approved the programme, so register for it on the RCI website too.
 * Goes to everyone claiming CRE points whose RCI confirmation has not been uploaded yet
 * (payment not rejected), once each. A coordinator presses the button on the desk to send it.
 */
export function rciReminderDue(row: Registration): boolean {
  return (
    row.creClaim === "yes" &&
    rciState(row) === "awaited" &&
    paymentState(row) !== "rejected" &&
    !row.deskReview?.mailed?.rciReminder
  );
}

export async function mailRciReminder(reference: string, origin: string, force = false): Promise<boolean> {
  if (!mailReady()) return false;
  const row = await getRegistration(reference);
  if (!row) return false;
  if (!force && !rciReminderDue(row)) return false;

  const name = `${row.title ? `${row.title} ` : ""}${row.fullName}`;
  const token = participantToken(row.reference);
  const statusUrl = token ? `${origin}/status/${row.reference}?t=${encodeURIComponent(token)}` : null;
  const uploadUrl = `${origin}/registration/rci`;
  const where = `${programme.rciPortal} → CRE Calendar → 19 December 2026 → "${programme.title}" (institute ${programme.instituteCode})`;

  const result = await sendMail({
    to: row.email,
    subject: `Action needed for CRE points: register on the RCI website — ${programme.title} (${row.reference})`,
    text: [
      `Dear ${name},`,
      "",
      `Good news: the Rehabilitation Council of India has approved ${programme.title}: ${programme.subtitle} as a ${programme.level.toLowerCase()}-level CRE programme of ${programme.rciHours} hours (F. No. ${programme.rciFileNo}). It is listed on the RCI CRE calendar for ${programme.dateLabel}.`,
      "",
      "You registered with us to claim RCI CRE points. To receive them, please also do these two steps:",
      `1. Register for this programme on the RCI website with your CRR login: ${where}`,
      `   RCI CRE calendar: ${programme.rciCalendarUrl}`,
      `2. Upload RCI's confirmation mail (a screenshot is fine) on our site: ${uploadUrl}`,
      "",
      "Without the RCI registration, CRE points cannot be credited to your RCI profile.",
      "",
      `Your reference: ${row.reference}`,
      statusUrl ? `Your status page: ${statusUrl}` : "",
      `Participants' WhatsApp group: ${programme.whatsappUrl}`,
      "",
      `${programme.organiser}, ${programme.university}`,
      programme.email,
    ]
      .filter((line, index, all) => line !== "" || all[index - 1] !== "")
      .join("\n"),
    html: shell(
      `<p>Dear ${esc(name)},</p>
       <p><strong>The Rehabilitation Council of India has approved ${esc(programme.title)}</strong> as a ${esc(programme.level.toLowerCase())}-level CRE programme of ${programme.rciHours} hours (F. No. ${esc(programme.rciFileNo)}). It is listed on the RCI CRE calendar for ${esc(programme.dateLabel)}.</p>
       <p>You registered with us to claim RCI CRE points. <strong>To receive them, please also:</strong></p>
       <ol style="padding-left:20px">
         <li style="margin-bottom:6px">Register for this programme on the <strong>RCI website</strong> with your CRR login: ${esc(where)}.</li>
         <li>Upload RCI's confirmation mail (a screenshot is fine) on our site under <em>Add RCI confirmation</em>.</li>
       </ol>
       <p>${button(programme.rciCalendarUrl, "Open the RCI CRE calendar")}</p>
       <p>${button(uploadUrl, "Add RCI confirmation", true)}</p>
       <p style="color:#5c6678">Without the RCI registration, CRE points cannot be credited to your RCI profile. Reference: ${esc(row.reference)}${
         statusUrl ? ` · <a href="${esc(statusUrl)}" style="color:#0f214a">your status page</a>` : ""
       }</p>`,
    ),
  });
  if (!result.sent) return false;
  const fresh = await getRegistration(row.reference);
  const review = fresh?.deskReview ?? {};
  await saveDeskReview(row.reference, { ...review, mailed: { ...(review.mailed ?? {}), rciReminder: new Date().toISOString() } });
  return true;
}
