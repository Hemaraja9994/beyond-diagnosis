import { adminFromRequest, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { verifyRegistration } from "@/lib/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

/** "Check again" button on the coordinator desk. */
export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  if (!/^YDU-[A-Z2-9]{12}$/.test(key)) return json({ error: "That registration was not found." }, 404);
  await verifyRegistration(key);
  return Response.redirect(new URL(`/admin#${key}`, request.url), 303);
}
