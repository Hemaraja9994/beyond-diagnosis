import { adminReady, credentialsMatch, sameOrigin, sessionCookie } from "@/lib/admin";
import { json, readBody } from "@/lib/http";
import { clearClientLimit, tooMany } from "@/lib/limit";
import { asRecord, readString } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Sign in from this website." }, 403);
  if (!adminReady()) return json({ error: "The desk has no access code on this deployment yet." }, 503);
  const limited = tooMany(request, "login", 8, 15 * 60 * 1000);
  if (limited) return limited;
  const body = await readBody(request);
  if (body instanceof Response) return body;
  const record = asRecord(body);
  const email = record ? readString(record, "email") : "";
  const code = record ? readString(record, "code") : "";
  if (!credentialsMatch(email, code)) {
    return json({ error: "That email or access code was not accepted." }, 401);
  }
  clearClientLimit(request, "login");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": sessionCookie(email),
    },
  });
}
