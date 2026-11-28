import { after } from "next/server";
import { participantToken, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { tooMany } from "@/lib/limit";
import { notifyParticipant } from "@/lib/notify";
import { onlineProgramme } from "@/lib/programme";
import { onlineRegistrationOpen } from "@/lib/settings";
import { createRegistration } from "@/lib/store";
import { readUploads } from "@/lib/uploads";
import { formRecord, parseOnlineRegistration } from "@/lib/validate";
import { verifyRegistration } from "@/lib/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Registration for the regular online programme (non-RCI track). Same fee, receipt check and emails as the RCI
 * track, but no CRE claim, no CRR number and no CRE place limit. It has its own open/closed switch and closing date.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  if (!(await onlineRegistrationOpen())) {
    return json({ error: `Registration for the ${onlineProgramme.shortName.toLowerCase()} has closed. Please write to the organisers.` }, 403);
  }
  const limited = tooMany(request, "register-online", 4, 10 * 60 * 1000);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "The form could not be read. If you attached large files, attach smaller ones." }, 400);
  }
  const parsed = parseOnlineRegistration(formRecord(form));
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const uploads = await readUploads(form);
  if ("error" in uploads) return json({ error: uploads.error }, 400);
  const files = uploads.value.filter((upload) => upload.kind === "payment");
  if (files.length === 0) return json({ error: "Attach the payment receipt or screenshot." }, 400);

  const result = await createRegistration(parsed.value, files);
  if ("error" in result) return json({ error: result.error }, result.status);

  const origin = new URL(request.url).origin;
  after(async () => {
    try {
      await verifyRegistration(result.reference);
    } catch (error) {
      console.error("register-online: verification failed", error);
    }
    await notifyParticipant(result.reference, origin).catch((error) => console.error("register-online: email failed", error));
  });
  return json({ reference: result.reference, token: participantToken(result.reference), creMoved: false });
}
