import { adminFromRequest, sameOrigin } from "@/lib/admin";
import { json, readBody } from "@/lib/http";
import { setMeetingUrl } from "@/lib/store";
import { asRecord, isWebexUrl, readString } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Save the link from this website." }, 403);
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const body = await readBody(request);
  if (body instanceof Response) return body;
  const record = asRecord(body);
  const url = record ? readString(record, "url") : "";
  if (!isWebexUrl(url)) return json({ error: "Use an https address on webex.com." }, 400);
  await setMeetingUrl(url);
  return json({ ok: true });
}
