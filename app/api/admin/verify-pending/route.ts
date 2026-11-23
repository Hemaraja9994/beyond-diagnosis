import { adminFromRequest, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { listRegistrations } from "@/lib/store";
import { verifyRegistration } from "@/lib/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

const batch = 8;

/** Checks registrations that have no result yet (older ones, or ones whose files changed), a few at a time. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const pending = (await listRegistrations()).filter((row) => row.verification === null).slice(0, batch);
  for (const row of pending) {
    try {
      await verifyRegistration(row.reference);
    } catch (error) {
      console.error("verify-pending", row.reference, error);
    }
  }
  return Response.redirect(new URL(`/admin?checked=${pending.length}#registrations`, request.url), 303);
}
