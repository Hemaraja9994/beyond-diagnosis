import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { getRegistration, saveDeskReview } from "@/lib/store";
import type { DeskReview } from "@/lib/verify-types";

export const runtime = "nodejs";

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
  const stamp = { by: user.name, at: new Date().toISOString() };
  const review: DeskReview = { ...(registration.deskReview ?? {}) };
  switch (action) {
    case "pay-verified":
      review.payment = { decision: "verified", ...stamp };
      break;
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
  return Response.redirect(new URL(`/admin#${key}`, request.url), 303);
}
