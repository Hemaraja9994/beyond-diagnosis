import { after } from "next/server";
import { participantToken, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { tooMany } from "@/lib/limit";
import { updateRegistration } from "@/lib/store";
import { readUploads } from "@/lib/uploads";
import { formRecord, parseUpdate } from "@/lib/validate";
import { verifyRegistration } from "@/lib/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  const limited = tooMany(request, "update", 8, 15 * 60 * 1000);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "The form could not be read. If you attached large files, attach smaller ones." }, 400);
  }
  const parsed = parseUpdate(formRecord(form));
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const uploads = await readUploads(form);
  if ("error" in uploads) return json({ error: uploads.error }, 400);

  const result = await updateRegistration(parsed.value, uploads.value);
  if ("error" in result) return json({ error: result.error }, result.status);

  const reference = result.registration.reference;
  after(async () => {
    try {
      await verifyRegistration(reference);
    } catch (error) {
      console.error("update: verification failed", error);
    }
  });
  const saved = result.registration;
  return json({
    ok: true,
    reference,
    token: participantToken(reference),
    title: saved.title,
    creClaim: saved.creClaim,
    crrNumber: saved.crrNumber,
    paymentReference: saved.paymentReference,
    documents: saved.documents,
  });
}
