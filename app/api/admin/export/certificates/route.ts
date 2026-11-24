import { adminFromRequest } from "@/lib/admin";
import { certificatePdf, type Edition } from "@/lib/certificate-pdf";
import { certificateEligible, certificateFileName, certificatesReleased, certificateVerifyUrl, ensureCertificate, numberAllEligible } from "@/lib/certificates";
import { json } from "@/lib/http";
import { listRegistrations } from "@/lib/store";
import { zipFiles } from "@/lib/zip";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Every issued certificate in one ZIP, in certificate-number order (?edition=print for the print edition). Available once released. */
export async function GET(request: Request) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  if (!(await certificatesReleased())) return json({ error: "Release certificates on the desk first (from the programme day)." }, 403);
  const url = new URL(request.url);
  const origin = url.origin;
  const edition: Edition = url.searchParams.get("edition") === "print" ? "print" : "digital";
  const all = await listRegistrations();
  await numberAllEligible(all);
  const rows = (await listRegistrations()).filter(certificateEligible);
  const files: { name: string; data: Uint8Array }[] = [];
  const issuedList = await Promise.all(rows.map(async (row) => ({ row, issued: await ensureCertificate(row) })));
  issuedList.sort((a, b) => a.issued.number - b.issued.number);
  for (const { row, issued } of issuedList) {
    files.push({ name: certificateFileName(row, issued), data: await certificatePdf(row, issued, certificateVerifyUrl(origin, row.reference), edition) });
  }
  const zip = zipFiles(files);
  return new Response(new Uint8Array(zip), {
    headers: {
      "content-type": "application/zip",
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="Beyond-the-Diagnosis-certificates-${edition}-${files.length}.zip"`,
    },
  });
}
