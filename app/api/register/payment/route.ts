import { after } from "next/server";
import { participantToken, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { tooMany } from "@/lib/limit";
import { readProof } from "@/lib/proof";
import { updateRegistration } from "@/lib/store";
import { normalisePaymentReference } from "@/lib/validate";
import { notifyParticipant } from "@/lib/notify";
import { verifyRegistration } from "@/lib/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Kept for pages opened before the pay-first form went live: the older confirmation screen posts the
 * payment id and screenshot here. It saves them on the registration exactly as "Update my registration" does.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  const limited = tooMany(request, "payment", 8, 15 * 60 * 1000);
  if (limited) return limited;
  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: "The payment could not be read." }, 400);
  const reference = String(form.get("reference") ?? "").trim().toUpperCase();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const rawId = String(form.get("paymentReference") ?? "").trim();
  const paymentReference = rawId === "" ? "" : normalisePaymentReference(rawId);
  if (paymentReference === null) return json({ error: "The payment id can use letters, numbers, and simple punctuation only." }, 400);
  const proof = await readProof(form.get("proof"), "payment screenshot");
  if ("error" in proof) return json({ error: proof.error }, 400);
  if (paymentReference === "" && !("value" in proof)) {
    return json({ error: "Add the Razorpay payment id, or upload a screenshot of the payment." }, 400);
  }
  if (!/^YDU-[A-Z2-9]{12}$/.test(reference)) return json({ error: "Enter the registration reference from your confirmation." }, 400);
  const result = await updateRegistration(
    { reference, email, title: "", creClaim: "", crrNumber: "", paymentReference },
    "value" in proof ? [{ kind: "payment", file: proof.value }] : [],
  );
  if ("error" in result) return json({ error: result.error }, result.status);
  const origin = new URL(request.url).origin;
  after(async () => {
    try {
      await verifyRegistration(reference);
    } catch (error) {
      console.error("payment: verification failed", error);
    }
    await notifyParticipant(reference, origin).catch((error) => console.error("payment: email failed", error));
  });
  return json({ ok: true, token: participantToken(reference) });
}
