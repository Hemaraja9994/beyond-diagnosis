import { after } from "next/server";
import { participantToken, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { tooMany } from "@/lib/limit";
import { createRegistration } from "@/lib/store";
import { readUploads } from "@/lib/uploads";
import { formRecord, parseRegistration } from "@/lib/validate";
import { verifyRegistration } from "@/lib/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  const limited = tooMany(request, "register", 4, 10 * 60 * 1000);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "The form could not be read. If you attached large files, attach smaller ones." }, 400);
  }
  const parsed = parseRegistration(formRecord(form));
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const uploads = await readUploads(form);
  if ("error" in uploads) return json({ error: uploads.error }, 400);
  if (!uploads.value.some((upload) => upload.kind === "payment")) {
    return json({ error: "Attach the payment receipt or screenshot." }, 400);
  }

  const result = await createRegistration(parsed.value, uploads.value);
  if ("error" in result) return json({ error: result.error }, result.status);

  // Read the receipt after replying, so the participant is not kept waiting.
  after(async () => {
    try {
      await verifyRegistration(result.reference);
    } catch (error) {
      console.error("register: verification failed", error);
    }
  });
  return json({ reference: result.reference, token: participantToken(result.reference) });
}
