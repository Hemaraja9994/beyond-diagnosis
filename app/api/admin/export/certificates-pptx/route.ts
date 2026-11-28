import { adminFromRequest } from "@/lib/admin";
import { certificatesPptx } from "@/lib/certificate-pptx";
import { certificateEligible, ensureCertificate, numberAllEligible } from "@/lib/certificates";
import { json } from "@/lib/http";
import { isOnlineTrack } from "@/lib/programme";
import { listRegistrations } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Every certificate of one programme track as a PowerPoint file (?track=rci, the default, or ?track=online), in
 * certificate-number order, for coordinators to add e-signatures. Available to the desk at any time; downloading
 * saves the certificate numbers for everyone eligible.
 */
export async function GET(request: Request) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const url = new URL(request.url);
  const track = url.searchParams.get("track") === "online" ? "online" : "rci";
  await numberAllEligible(await listRegistrations());
  const rows = (await listRegistrations()).filter(certificateEligible).filter((row) => isOnlineTrack(row) === (track === "online"));
  if (rows.length === 0) return json({ error: "No certificates in this list yet: payments must be confirmed first." }, 404);
  const items = await Promise.all(rows.map(async (row) => ({ row, issued: await ensureCertificate(row) })));
  items.sort((a, b) => a.issued.number - b.issued.number);
  const bytes = await certificatesPptx(items, track);
  const label = track === "online" ? "online-programme" : "rci-cre";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="Beyond-the-Diagnosis-certificates-${label}-${items.length}.pptx"`,
    },
  });
}
