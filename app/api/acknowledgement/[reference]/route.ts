import { participantTokenOk } from "@/lib/admin";
import { acknowledgementPdf } from "@/lib/acknowledgement";
import { json } from "@/lib/http";
import { getRegistration } from "@/lib/store";

export const runtime = "nodejs";

/** The participant's A4 acknowledgement. Opened with the short code from the confirmation or status page. */
export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  const url = new URL(request.url);
  const token = url.searchParams.get("t") ?? "";
  if (!/^YDU-[A-Z2-9]{12}$/.test(key) || !participantTokenOk(key, token)) {
    return json({ error: "This link is not valid. Look up your registration on the status page." }, 404);
  }
  const registration = await getRegistration(key);
  if (!registration) return json({ error: "That registration was not found." }, 404);
  const statusUrl = `${url.origin}/status/${key}?t=${encodeURIComponent(token)}`;
  const bytes = await acknowledgementPdf(registration, statusUrl);
  const download = url.searchParams.get("download") === "1";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "cache-control": "private, no-store",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="Acknowledgement-${key}.pdf"`,
      "x-content-type-options": "nosniff",
    },
  });
}
