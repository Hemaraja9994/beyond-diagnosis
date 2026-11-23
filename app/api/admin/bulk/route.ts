import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { after } from "next/server";
import { notifyParticipant } from "@/lib/notify";
import { listRegistrations, saveDeskReview } from "@/lib/store";
import { withHistory, type DeskReview } from "@/lib/verify-types";
import { afterSessionsOpen, programme } from "@/lib/programme";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Bulk update: paste emails, CRR numbers or YDU- references (one per line, or copied straight from a
 * Webex attendance report / an RCI list) and apply one decision to every matching participant.
 */
const actions: Record<string, (review: DeskReview, stamp: { by: string; at: string }) => void> = {
  "att-attended": (r, s) => void (r.attendance = { decision: "attended", ...s }),
  "exam-passed": (r, s) => void (r.exam = { decision: "passed", ...s }),
  "exam-not-passed": (r, s) => void (r.exam = { decision: "not-passed", ...s }),
  "pts-credited": (r, s) => void (r.points = { decision: "credited", ...s }),
  "rci-confirmed": (r, s) => void (r.rci = { decision: "confirmed", ...s }),
  "pay-verified": (r, s) => void (r.payment = { decision: "verified", ...s }),
};

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const form = await request.formData().catch(() => null);
  const action = String(form?.get("action") ?? "");
  const list = String(form?.get("list") ?? "");
  const apply = actions[action];
  const back = (message: string) => Response.redirect(new URL(`/admin?tab=bulk&bulk=${encodeURIComponent(message)}`, request.url), 303);
  if (!apply) return back("Choose what to mark.");
  if (/^(att|exam|pts)-/.test(action) && !afterSessionsOpen()) {
    return back(`Attendance, RCI exam and CRE points can be entered from ${programme.dateLabel}.`);
  }
  if (action === "pay-verified" && form?.get("checked") !== "yes") {
    return back("To mark payments verified in bulk, tick “I checked these payments myself”.");
  }

  const emails = new Set((list.match(/[^\s,;<>"']+@[^\s,;<>"']+\.[a-z]{2,}/gi) ?? []).map((item) => item.toLowerCase()));
  const crrs = new Set((list.toUpperCase().match(/\bA\d{3,8}\b/g) ?? []));
  const references = new Set((list.toUpperCase().match(/\bYDU-[A-Z2-9]{12}\b/g) ?? []));
  if (emails.size + crrs.size + references.size === 0) return back("No emails, CRR numbers or references were found in the pasted text.");

  const stamp = { by: user.name, at: new Date().toISOString() };
  const matched = new Set<string>();
  for (const row of await listRegistrations()) {
    const hit = references.has(row.reference) || emails.has(row.email.toLowerCase()) || crrs.has(row.crrNumber.toUpperCase());
    if (!hit) continue;
    const review: DeskReview = { ...(row.deskReview ?? {}) };
    apply(review, stamp);
    if (action === "pay-verified" && row.verification?.status !== "verified" && review.payment) review.payment.override = true;
    await saveDeskReview(row.reference, withHistory(review, user.name, `Bulk: ${action}`));
    matched.add(row.email.toLowerCase());
    matched.add(row.crrNumber.toUpperCase());
    matched.add(row.reference);
  }
  if (action === "pay-verified" || action === "rci-confirmed") {
    const origin = new URL(request.url).origin;
    const touched = [...matched].filter((item) => item.startsWith("YDU-"));
    after(async () => {
      for (const reference of touched) await notifyParticipant(reference, origin).catch(() => []);
    });
  }
  const unmatched = [...emails, ...crrs, ...references].filter((item) => !matched.has(item));
  const updated = new Set([...matched].filter((item) => item.startsWith("YDU-"))).size;
  return back(
    `Updated ${updated} participant${updated === 1 ? "" : "s"}.${unmatched.length ? ` Not found: ${unmatched.slice(0, 15).join(", ")}${unmatched.length > 15 ? "…" : ""}` : ""}`,
  );
}
