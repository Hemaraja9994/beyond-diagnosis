import { participantToken } from "@/lib/admin";
import { certificatePdf } from "@/lib/certificate-pdf";
import {
  certificateEligible,
  certificateFileName,
  rowCertificateNumber,
  certificatesReleased,
  certificateVerifyUrl,
  ensureCertificate,
  linkedInAddUrl,
  participantName,
} from "@/lib/certificates";
import { mailReady, sendMail } from "@/lib/mail";
import { button, esc, shell } from "@/lib/notify";
import { programme } from "@/lib/programme";
import { getRegistration, saveDeskReview, type Registration } from "@/lib/store";

/** Emails one participant their e-certificate (PDF attached), once. Returns true when it went out. */
export async function mailCertificate(reference: string, origin: string, force = false): Promise<boolean> {
  if (!mailReady() || !(await certificatesReleased())) return false;
  const row = await getRegistration(reference);
  if (!row || !certificateEligible(row)) return false;
  if (row.deskReview?.mailed?.certificate && !force) return false;

  const issued = await ensureCertificate(row);
  const verifyUrl = certificateVerifyUrl(origin, row.reference);
  const token = participantToken(row.reference);
  const statusUrl = token ? `${origin}/status/${row.reference}?t=${encodeURIComponent(token)}` : null;
  const linkedIn = linkedInAddUrl(row, issued, verifyUrl);
  const name = participantName(row);
  const number = rowCertificateNumber(row, issued);
  const pdf = Buffer.from(await certificatePdf(row, issued, verifyUrl));

  const result = await sendMail({
    to: row.email,
    subject: `Your e-certificate — ${programme.title} (${number})`,
    text: [
      `Dear ${name},`,
      "",
      `Thank you for participating in ${programme.title}: ${programme.subtitle}, held online on ${programme.dateLabel}.`,
      "",
      "Your e-certificate of participation is attached.",
      `Certificate No.: ${number}`,
      `Verify online: ${verifyUrl}`,
      `Add it to your LinkedIn profile: ${linkedIn}`,
      statusUrl ? `Download it again any time: ${statusUrl}` : "",
      "",
      "With best wishes,",
      `${programme.organiser}, ${programme.hospital}`,
      programme.university,
    ]
      .filter((line, index, all) => line !== "" || all[index - 1] !== "")
      .join("\n"),
    html: shell(
      `<p>Dear ${esc(name)},</p>
       <p>Thank you for participating in <strong>${esc(programme.title)}</strong>: ${esc(programme.subtitle)}, held online on ${esc(programme.dateLabel)}.</p>
       <p>Your <strong>e-certificate of participation</strong> is attached as a PDF.</p>
       <table style="border-collapse:collapse;margin:12px 0">
         <tr><td style="padding:4px 14px 4px 0;color:#5c6678">Certificate No.</td><td style="padding:4px 0;font-weight:600">${esc(number)}</td></tr>
       </table>
       <p>${button(linkedIn, "Add to my LinkedIn profile")}</p>
       <p>${button(verifyUrl, "Verify this certificate", true)}</p>
       ${statusUrl ? `<p style="color:#5c6678">Download it again any time from <a href="${esc(statusUrl)}" style="color:#0f214a">your status page</a>.</p>` : ""}
       <p>With best wishes from the organising team.</p>`,
    ),
    attachments: [{ filename: certificateFileName(row, issued), content: pdf, contentType: "application/pdf" }],
  });
  if (!result.sent) return false;
  const fresh = await getRegistration(row.reference);
  const review = fresh?.deskReview ?? {};
  await saveDeskReview(row.reference, { ...review, mailed: { ...(review.mailed ?? {}), certificate: new Date().toISOString() } });
  return true;
}

export function certificateMailDue(row: Registration): boolean {
  return certificateEligible(row) && !row.deskReview?.mailed?.certificate;
}
