import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { deleteRegistration } from "@/lib/store";

export const runtime = "nodejs";

/** Deletes a registration for good. The coordinator must type its reference to confirm. */
export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  const form = await request.formData().catch(() => null);
  const typed = String(form?.get("confirm") ?? "").trim().toUpperCase();
  if (typed !== key) {
    return Response.redirect(new URL(`/admin/edit/${key}?saved=${encodeURIComponent("Not deleted: type the reference exactly to confirm.")}`, request.url), 303);
  }
  const removed = await deleteRegistration(key);
  console.log(`desk: ${key} deleted by ${user.name}`);
  const message = removed ? `${key} was deleted by ${user.name}.` : `${key} was not found.`;
  return Response.redirect(new URL(`/admin?mail=${encodeURIComponent(message)}#registrations`, request.url), 303);
}
