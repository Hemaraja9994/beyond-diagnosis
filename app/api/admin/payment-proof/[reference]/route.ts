import { adminFromRequest } from "@/lib/admin";
import { json } from "@/lib/http";
import { getPaymentProof } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  if (!/^YDU-[A-Z2-9]{12}$/.test(key)) return json({ error: "That registration was not found." }, 404);
  const proof = await getPaymentProof(key);
  if (!proof) return json({ error: "No screenshot for that registration." }, 404);
  const extension = proof.contentType === "image/png" ? "png" : proof.contentType === "image/webp" ? "webp" : "jpg";
  return new Response(new Uint8Array(proof.bytes), {
    headers: {
      "content-type": proof.contentType,
      "cache-control": "private, no-store",
      "content-disposition": `inline; filename="${key}.${extension}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
