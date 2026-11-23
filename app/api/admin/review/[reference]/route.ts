import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { after } from "next/server";
import { notifyParticipant } from "@/lib/notify";
import { getRegistration, saveDeskReview, setCreClaim } from "@/lib/store";
import type { DeskReview } from "@/lib/verify-types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** A coordinator's own decision on the payment or the RCI confirmation, recorded with her name. */
export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  const registration = /^YDU-[A-Z2-9]{12}$/.test(key) ? await getRegistration(key) : null;
  if (!registration) return json({ error: "That registration was not found." }, 404);

  const form = await request.formData().catch(() => null);
  const action = String(form?.get("action") ?? "");
  const back = (message?: string) =>
    Response.redirect(new URL(`/admin${message ? `?note=${encodeURIComponent(message)}` : ""}#${key}`, request.url), 303);

  if (action === "cre-yes" || action === "cre-no") {
    const result = await setCreClaim(key, action === "cre-yes" ? "yes" : "no");
    if ("error" in result) return back(result.error);
    return back(`${key}: marked as ${action === "cre-yes" ? "claiming" : "not claiming"} RCI CRE points.`);
  }

  const stamp = { by: user.name, at: new Date().toISOString() };
  const review: DeskReview = { ...(registration.deskReview ?? {}) };
  switch (action) {
    case "pay-verified": {
      // The automatic check did not pass: the coordinator must say she checked the payment herself.
      const override = registration.verification?.status !== "verified";
      if (override && form?.get("checked") !== "yes") {
        return back(`${key}: tick “I checked this payment myself” before marking it verified.`);
      }
      review.payment = { decision: "verified", ...stamp, ...(override ? { override: true } : {}) };
      break;
    }
    case "pay-rejected":
      review.payment = { decision: "rejected", ...stamp };
      break;
    case "pay-clear":
      delete review.payment;
      break;
    case "rci-confirmed":
      review.rci = { decision: "confirmed", ...stamp };
      break;
    case "rci-rejected":
      review.rci = { decision: "rejected", ...stamp };
      break;
    case "rci-clear":
      delete review.rci;
      break;
    case "att-attended":
      review.attendance = { decision: "attended", ...stamp };
      break;
    case "att-absent":
      review.attendance = { decision: "absent", ...stamp };
      break;
    case "att-clear":
      delete review.attendance;
      break;
    case "exam-passed":
      review.exam = { decision: "passed", ...stamp };
      break;
    case "exam-not-passed":
      review.exam = { decision: "not-passed", ...stamp };
      break;
    case "exam-not-taken":
      review.exam = { decision: "not-taken", ...stamp };
      break;
    case "exam-clear":
      delete review.exam;
      break;
    case "pts-credited":
      review.points = { decision: "credited", ...stamp };
      break;
    case "pts-clear":
      delete review.points;
      break;
    default:
      return json({ error: "Unknown action." }, 400);
  }
  await saveDeskReview(key, review);
  const origin = new URL(request.url).origin;
  after(() => notifyParticipant(key, origin).catch((error) => console.error("review: email failed", error)));
  return back();
}
