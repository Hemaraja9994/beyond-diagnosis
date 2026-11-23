import { participantToken, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";
import { tooMany } from "@/lib/limit";
import { getRegistration } from "@/lib/store";
import { asRecord, readString } from "@/lib/validate";

export const runtime = "nodejs";

/** Reference + email → the private link to the status page and acknowledgement. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Use the form on this website." }, 403);
  const limited = tooMany(request, "lookup", 10, 15 * 60 * 1000);
  if (limited) return limited;
  const record = asRecord(await request.json().catch(() => null));
  const reference = record ? readString(record, "reference").toUpperCase() : "";
  const email = record ? readString(record, "email").toLowerCase() : "";
  const registration = /^YDU-[A-Z2-9]{12}$/.test(reference) ? await getRegistration(reference) : null;
  if (!registration || registration.email.toLowerCase() !== email) {
    return json({ error: "No registration matches that reference and email." }, 404);
  }
  const token = participantToken(reference);
  if (!token) return json({ error: "Status links are not switched on for this site yet." }, 503);
  return json({ reference, token });
}
