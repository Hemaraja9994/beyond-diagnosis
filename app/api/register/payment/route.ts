import { sameOrigin } from "@/lib/admin";
import { json, readBody } from "@/lib/http";
import { addPaymentReference } from "@/lib/store";
import { parsePayment } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  const body = await readBody(request);
  if (body instanceof Response) return body;
  const parsed = parsePayment(body);
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const result = await addPaymentReference(parsed.reference, parsed.email, parsed.paymentReference);
  if ("error" in result) return json({ error: result.error }, result.status);
  return json({ ok: true });
}
