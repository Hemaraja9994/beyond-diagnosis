import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { mailReady } from "@/lib/mail";
import { mailRciReminder, rciReminderDue } from "@/lib/rci-reminder";
import { listRegistrations } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

const batch = 12;

/** Desk button: emails the "register on the RCI website too" reminder to the next batch of CRE claimants, once each. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const back = (message: string) => Response.redirect(new URL(`/admin?mail=${encodeURIComponent(message)}#registrations`, request.url), 303);
  if (!mailReady()) return back("Email is not set up yet.");

  const origin = new URL(request.url).origin;
  const due = (await listRegistrations()).filter(rciReminderDue).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let sent = 0;
  for (const row of due.slice(0, batch)) if (await mailRciReminder(row.reference, origin).catch(() => false)) sent += 1;
  const left = due.length - sent;
  console.log(`desk: RCI reminder sent to ${sent} by ${user.name}; ${left} left`);
  return back(
    `RCI registration reminder emailed to ${sent} participant${sent === 1 ? "" : "s"} by ${user.name}.${
      left > 0 ? ` ${left} still to send — press the button again.` : " Everyone due has been reminded."
    }`,
  );
}
