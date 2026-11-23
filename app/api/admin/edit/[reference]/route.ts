import { after } from "next/server";
import { adminFromRequest, deskUser, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { notifyParticipant } from "@/lib/notify";
import { addDocuments, editRegistration, getRegistration, saveDeskReview } from "@/lib/store";
import { readUploads } from "@/lib/uploads";
import { formRecord, parseDeskEdit } from "@/lib/validate";
import { verifyRegistration } from "@/lib/verify";
import { withHistory } from "@/lib/verify-types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Master control: a coordinator changes any field and uploads documents for a participant. */
export async function POST(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(request)) return json({ error: "Use the coordinator desk." }, 403);
  const user = deskUser(adminFromRequest(request));
  if (!user) return json({ error: "Sign in at the coordinator desk." }, 401);
  const { reference } = await context.params;
  const key = reference.toUpperCase();
  const back = (message: string) => Response.redirect(new URL(`/admin/edit/${key}?saved=${encodeURIComponent(message)}`, request.url), 303);
  const current = /^YDU-[A-Z2-9]{12}$/.test(key) ? await getRegistration(key) : null;
  if (!current) return json({ error: "That registration was not found." }, 404);

  const form = await request.formData().catch(() => null);
  if (!form) return back("The form could not be read. If you attached large files, attach smaller ones.");
  const notes: string[] = [];

  if (form.get("action") === "details") {
    const parsed = parseDeskEdit(formRecord(form));
    if ("error" in parsed) return back(parsed.error);
    const result = await editRegistration(key, parsed.value, { allowDuplicatePayment: form.get("allowDuplicatePayment") === "on" });
    if ("error" in result) return back(result.error);
    if (result.changed.length > 0) notes.push(`Edited ${result.changed.join(", ")}`);
  }

  const uploads = await readUploads(form);
  if ("error" in uploads) return back(uploads.error);
  if (uploads.value.length > 0) {
    await addDocuments(key, uploads.value);
    notes.push(`Uploaded ${uploads.value.map((upload) => upload.kind).join(", ")}`);
  }

  if (notes.length === 0) return back("Nothing changed.");
  const fresh = await getRegistration(key);
  await saveDeskReview(key, withHistory(fresh?.deskReview ?? {}, user.name, notes.join("; ")));
  const origin = new URL(request.url).origin;
  after(async () => {
    await verifyRegistration(key).catch(() => null);
    await notifyParticipant(key, origin).catch(() => []);
  });
  return back(`Saved: ${notes.join("; ")}.`);
}
