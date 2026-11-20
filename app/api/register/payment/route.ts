import { sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { tooMany } from "@/lib/limit";
import { readProof } from "@/lib/proof";
import { addPayment } from "@/lib/store";
import { parsePaymentFields } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  const limited = tooMany(request, "payment", 8, 15 * 60 * 1000);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "The payment could not be read." }, 400);
  }

  const proof = await readProof(form.get("proof"));
  if ("error" in proof) return json({ error: proof.error }, 400);
  const parsed = parsePaymentFields({
    reference: String(form.get("reference") ?? ""),
    email: String(form.get("email") ?? ""),
    paymentReference: String(form.get("paymentReference") ?? ""),
    hasProof: "value" in proof,
  });
  if ("error" in parsed) return json({ error: parsed.error }, 400);

  const result = await addPayment(parsed.reference, parsed.email, parsed.paymentReference, "value" in proof ? proof.value : null);
  if ("error" in result) return json({ error: result.error }, result.status);
  return json({ ok: true });
}
