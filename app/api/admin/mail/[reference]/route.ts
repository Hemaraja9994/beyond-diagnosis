import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { mailReady } from "@/lib/mail";
import { notifyParticipant } from "@/lib/notify";

export const runtime = "nodejs";
export const maxDuration = 60;

/** "Resend confirmation" on the desk: sends the registration mail again, with the current status and PDF. */
export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  if (!deskUser(adminFromRequest(request))) return json({ error: "Sign in at the coordinator desk." }, 401);
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  const back = (message: string) => Response.redirect(new URL(`/admin?mail=${encodeURIComponent(message)}#${key}`, request.url), 303);
  if (!/^YDU-[A-Z2-9]{12}$/.test(key)) return back("That registration was not found.");
  if (!mailReady()) return back("Email is not set up yet.");
  const sent = await notifyParticipant(key, new URL(request.url).origin, "registration");
  return back(sent.length > 0 ? `Confirmation sent to ${key}.` : `The email to ${key} could not be sent — check the Vercel logs.`);
}
