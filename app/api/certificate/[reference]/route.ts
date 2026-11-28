import { adminFromRequest, participantTokenOk } from "@/lib/admin";
import { certificatePdf, type Edition } from "@/lib/certificate-pdf";
import { certificateEligible, certificateFileName, certificatesReleased, certificateVerifyUrl, ensureCertificate, numberAllEligible } from "@/lib/certificates";
import { json } from "@/lib/http";
import { getRegistration, listRegistrations } from "@/lib/store";

export const runtime = "nodejs";

/**
 * The participant's e-certificate. Participants open it with the code from their status page once certificates
 * are released. A signed-in coordinator can open anyone's at any time: the first desk preview saves certificate
 * numbers for everyone eligible, in order of registration, so a preview is always the final certificate.
 */
export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  const url = new URL(request.url);
  const token = url.searchParams.get("t") ?? "";
  const desk = adminFromRequest(request) !== null;
  if (!/^YDU-[A-Z2-9]{12}$/.test(key) || (!desk && !participantTokenOk(key, token))) {
    return json({ error: "This link is not valid. Look up your registration on the status page." }, 404);
  }
  let row = await getRegistration(key);
  if (!row) return json({ error: "That registration was not found." }, 404);
  const released = await certificatesReleased();
  if (!certificateEligible(row)) return json({ error: "The certificate is issued once the payment is confirmed." }, 403);
  if (!released && !desk) return json({ error: "Certificates are not released yet. They will appear on your status page after the programme." }, 403);

  if (!row.deskReview?.certificate) {
    await numberAllEligible(await listRegistrations());
    row = (await getRegistration(key)) ?? row;
  }
  const issued = await ensureCertificate(row);
  const edition: Edition = url.searchParams.get("edition") === "print" ? "print" : "digital";
  const bytes = await certificatePdf(row, issued, certificateVerifyUrl(url.origin, key), edition);
  const download = url.searchParams.get("download") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "cache-control": "private, no-store",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${certificateFileName(row, issued).replace(/\.pdf$/, edition === "print" ? "-print.pdf" : ".pdf")}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
