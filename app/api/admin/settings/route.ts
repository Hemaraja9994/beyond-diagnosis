import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { setCreSeatLimit, setRegistrationOpen } from "@/lib/settings";

export const runtime = "nodejs";

/** Desk switches: registration open or closed, and the number of RCI CRE places. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const form = await request.formData().catch(() => null);
  const seats = Number(form?.get("creSeats"));
  const open = String(form?.get("registrationOpen") ?? "yes") === "yes";
  const back = (message: string) => Response.redirect(new URL(`/admin?mail=${encodeURIComponent(message)}#settings`, request.url), 303);
  if (!Number.isInteger(seats) || seats < 0 || seats > 2000) return back("Enter the number of CRE places as a whole number.");
  await setCreSeatLimit(seats);
  await setRegistrationOpen(open);
  console.log(`desk: settings changed by ${user.name}: cre seats ${seats}, registration ${open ? "open" : "closed"}`);
  return back(`Saved by ${user.name}: ${seats} CRE places, registration ${open ? "open" : "closed"}.`);
}
