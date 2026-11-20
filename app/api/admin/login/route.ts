import { adminReady, credentialsMatch, sameOrigin, sessionCookie } from "@/lib/admin";
import { json, readBody } from "@/lib/http";
import { asRecord, readString } from "@/lib/validate";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; started: number }>();

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Sign in from this website." }, 403);
  if (!adminReady()) return json({ error: "The desk has no access code on this deployment yet." }, 503);
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0]?.trim() || "local";
  const now = Date.now();
  const prior = attempts.get(ip);
  if (prior && now - prior.started < 15 * 60 * 1000 && prior.count >= 8) {
    return json({ error: "Too many attempts. Wait a few minutes and try again." }, 429);
  }
  const body = await readBody(request);
  if (body instanceof Response) return body;
  const record = asRecord(body);
  const email = record ? readString(record, "email") : "";
  const code = record ? readString(record, "code") : "";
  if (!credentialsMatch(email, code)) {
    if (!prior || now - prior.started >= 15 * 60 * 1000) attempts.set(ip, { count: 1, started: now });
    else attempts.set(ip, { count: prior.count + 1, started: prior.started });
    return json({ error: "That email or access code was not accepted." }, 401);
  }
  attempts.delete(ip);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": sessionCookie(email),
    },
  });
}
