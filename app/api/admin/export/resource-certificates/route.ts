import { PDFDocument } from "pdf-lib";
import { adminFromRequest } from "@/lib/admin";
import { resourceCertificatePdf, resourcePersons, type Edition } from "@/lib/certificate-pdf";
import { json } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Certificates of Appreciation for the resource persons, one page each in session order.
 * ?edition=print (default) for printing and signing in ink; ?edition=digital to email.
 */
export async function GET(request: Request) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const url = new URL(request.url);
  const edition: Edition = url.searchParams.get("edition") === "digital" ? "digital" : "print";
  const merged = await PDFDocument.create();
  merged.setTitle(`Certificates of Appreciation — Resource Persons (${edition} edition)`);
  for (const person of resourcePersons) {
    const doc = await PDFDocument.load(await resourceCertificatePdf(person, url.origin, edition));
    const [page] = await merged.copyPages(doc, [0]);
    merged.addPage(page);
  }
  return new Response(new Uint8Array(await merged.save()), {
    headers: {
      "content-type": "application/pdf",
      "cache-control": "private, no-store",
      "content-disposition": `attachment; filename="Resource-Persons-Certificates-${edition === "print" ? "PRINT" : "Digital"}.pdf"`,
    },
  });
}
