import { after } from "next/server";
import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { notifyParticipant } from "@/lib/notify";
import { createRegistration, getRegistration, saveDeskReview } from "@/lib/store";
import { readUploads } from "@/lib/uploads";
import { formRecord, parseDeskEdit, type RegistrationDraft } from "@/lib/validate";
import { verifyRegistration } from "@/lib/verify";
import { withHistory, type DeskReview } from "@/lib/verify-types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * A coordinator adds a registration directly (an offline payment, a guest, a correction). It bypasses the
 * CRE place limit and the receipt requirement, and can mark the payment verified at once.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const form = await request.formData().catch(() => null);
  const back = (message: string) => Response.redirect(new URL(`/admin/new?saved=${encodeURIComponent(message)}`, request.url), 303);
  if (!form) return back("The form could not be read.");
  const parsed = parseDeskEdit(formRecord(form));
  if ("error" in parsed) return back(parsed.error);
  if (parsed.value.title === "") return back("Choose a title.");
  if (parsed.value.creClaim === "") return back("Choose whether CRE points are claimed.");
  const uploads = await readUploads(form);
  if ("error" in uploads) return back(uploads.error);

  const draft: RegistrationDraft = {
    ...parsed.value,
    title: parsed.value.title,
    creClaim: parsed.value.creClaim,
    source: "desk",
    consent: true,
  };
  const created = await createRegistration(draft, uploads.value, { allowDuplicatePayment: form.get("allowDuplicatePayment") === "on" });
  if ("error" in created) return back(created.error);

  let review: DeskReview = withHistory({}, user.name, "Added by a coordinator");
  if (form.get("paymentVerified") === "on") {
    review = withHistory({ ...review, payment: { decision: "verified", by: user.name, at: new Date().toISOString() } }, user.name, "Marked payment verified");
  }
  const fresh = await getRegistration(created.reference);
  await saveDeskReview(created.reference, { ...(fresh?.deskReview ?? {}), ...review });

  const origin = new URL(request.url).origin;
  const sendEmail = form.get("sendEmail") === "on";
  after(async () => {
    if (uploads.value.length > 0) await verifyRegistration(created.reference).catch(() => null);
    if (sendEmail) await notifyParticipant(created.reference, origin).catch(() => []);
  });
  return Response.redirect(new URL(`/admin/edit/${created.reference}?saved=${encodeURIComponent("Registration added.")}`, request.url), 303);
}
