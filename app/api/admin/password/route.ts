import { adminFromRequest, deskUser, hashPassword, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { deskAccountName } from "@/lib/programme";
import { setDeskPasswordHash } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Sets a coordinator password. Every signed-in coordinator (and the owner) can set or reset any of the three.
 * Only a scrypt hash is stored.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const form = await request.formData().catch(() => null);
  const username = String(form?.get("username") ?? "").trim().toLowerCase();
  const password = String(form?.get("password") ?? "");
  const back = (message: string) => Response.redirect(new URL(`/admin?password=${encodeURIComponent(message)}#accounts`, request.url), 303);
  if (!deskAccountName(username)) return back("Unknown coordinator.");
  if (password.length < 10) return back("Use at least 10 characters.");
  await setDeskPasswordHash(username, hashPassword(password));
  return back(`Password saved for ${username}.`);
}
