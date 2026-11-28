import { adminFromRequest } from "@/lib/admin";
import { certificatePdf, type Edition } from "@/lib/certificate-pdf";
import { certificateEligible, certificateFileName, certificateVerifyUrl, ensureCertificate, numberAllEligible } from "@/lib/certificates";
import { isOnlineTrack } from "@/lib/programme";
import { json } from "@/lib/http";
import { listRegistrations } from "@/lib/store";
import { zipFiles } from "@/lib/zip";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Every certificate in one ZIP, in certificate-number order (?edition=print for the print edition,
 * ?track=rci|online for one programme track). The desk can download them at any time; downloading saves the numbers.
 */
export async function GET(request: Request) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const url = new URL(request.url);
  const track = url.searchParams.get("track");
  const origin = url.origin;
  const edition: Edition = url.searchParams.get("edition") === "print" ? "print" : "digital";
  const all = await listRegistrations();
  await numberAllEligible(all);
  const rows = (await listRegistrations())
    .filter(certificateEligible)
    .filter((row) => (track === "online" ? isOnlineTrack(row) : track === "rci" ? !isOnlineTrack(row) : true));
  const files: { name: string; data: Uint8Array }[] = [];
  const issuedList = await Promise.all(rows.map(async (row) => ({ row, issued: await ensureCertificate(row) })));
  issuedList.sort((a, b) => Number(isOnlineTrack(a.row)) - Number(isOnlineTrack(b.row)) || a.issued.number - b.issued.number);
  for (const { row, issued } of issuedList) {
    files.push({ name: certificateFileName(row, issued), data: await certificatePdf(row, issued, certificateVerifyUrl(origin, row.reference), edition) });
  }
  const zip = zipFiles(files);
  return new Response(new Uint8Array(zip), {
    headers: {
      "content-type": "application/zip",
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="Beyond-the-Diagnosis-certificates-${track === "online" ? "online-" : track === "rci" ? "rci-" : ""}${edition}-${files.length}.zip"`,
    },
  });
}
