import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { deleteRegistration } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Deletes a registration for good — meant for test entries and duplicates.
 * The coordinator must type the reference again, so a mis-tap cannot delete anyone.
 */
export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  const back = (message: string, anchor = "") =>
    Response.redirect(new URL(`/admin?note=${encodeURIComponent(message)}${anchor}`, request.url), 303);
  if (!/^YDU-[A-Z2-9]{12}$/.test(key)) return back("That reference is not valid.");

  const form = await request.formData().catch(() => null);
  const typed = String(form?.get("confirm") ?? "").trim().toUpperCase();
  if (typed !== key) {
    if (form?.get("return") === "edit") {
      return Response.redirect(new URL(`/admin/edit/${key}?saved=${encodeURIComponent("Not deleted: type the reference exactly to confirm.")}`, request.url), 303);
    }
    return back(`${key} was not deleted: type the reference exactly to confirm.`, `#${key}`);
  }

  const removed = await deleteRegistration(key);
  if (!removed) return back("That registration was not found.");
  console.info(`desk: ${key} deleted by ${user.name}`);
  return back(`${key} deleted by ${user.name}.`);
}
