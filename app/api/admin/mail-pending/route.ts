import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { mailReady } from "@/lib/mail";
import { mailsDue, notifyParticipant } from "@/lib/notify";
import { listRegistrations } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const batch = 15;

/** Sends emails that are due (e.g. to people who registered before email was switched on), a batch at a time. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  if (!deskUser(adminFromRequest(request))) return json({ error: "Sign in at the coordinator desk." }, 401);
  const back = (message: string) => Response.redirect(new URL(`/admin?mail=${encodeURIComponent(message)}#registrations`, request.url), 303);
  if (!mailReady()) return back("Email is not set up yet.");
  const due = (await listRegistrations()).filter((row) => mailsDue(row).length > 0).slice(0, batch);
  let sent = 0;
  for (const row of due) {
    const kinds = await notifyParticipant(row.reference, new URL(request.url).origin).catch(() => []);
    sent += kinds.length;
  }
  return back(`Sent ${sent} email${sent === 1 ? "" : "s"} to ${due.length} participant${due.length === 1 ? "" : "s"}.`);
}
