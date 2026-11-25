import { after } from "next/server";
import { participantToken, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { tooMany } from "@/lib/limit";
import { crePosition, creSeatsLeft } from "@/lib/seats";
import { creSeatLimit, registrationOpen } from "@/lib/settings";
import { createRegistration, listRegistrations, setCreClaim } from "@/lib/store";
import { readUploads } from "@/lib/uploads";
import { formRecord, parseRegistration } from "@/lib/validate";
import { notifyParticipant } from "@/lib/notify";
import { verifyRegistration } from "@/lib/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  if (!(await registrationOpen())) return json({ error: "Registration is closed. Please write to the organisers." }, 403);
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
  const claiming = parsed.value.creClaim === "yes";
  // The receipt is required only from CRE claimants; others are confirmed from their payment ID.
  if (claiming && !uploads.value.some((upload) => upload.kind === "payment")) {
    return json({ error: "Attach the payment receipt or screenshot." }, 400);
  }
  const seatLimit = await creSeatLimit();
  if (claiming && (await creSeatsLeft()) <= 0) {
    return json(
      {
        error: `All ${seatLimit} RCI CRE places are taken. You can still register to attend: choose “No” under RCI CRE points.`,
        creFull: true,
      },
      409,
    );
  }

  const result = await createRegistration(parsed.value, uploads.value);
  if ("error" in result) return json({ error: result.error }, result.status);

  // First registered, first served: if two claimants took the last place at the same moment, the later one attends without CRE points.
  let creMoved = false;
  if (claiming) {
    const position = crePosition(await listRegistrations(), result.reference);
    if (position === null || position > seatLimit) {
      await setCreClaim(result.reference, "no");
      creMoved = true;
    }
  }

  // Read the receipt, then send the confirmation email, after replying, so the participant is not kept waiting.
  const origin = new URL(request.url).origin;
  after(async () => {
    try {
      await verifyRegistration(result.reference);
    } catch (error) {
      console.error("register: verification failed", error);
    }
    await notifyParticipant(result.reference, origin).catch((error) => console.error("register: email failed", error));
  });
  return json({ reference: result.reference, token: participantToken(result.reference), creMoved });
}
