import { sameOrigin } from "@/lib/admin";
import { json, readBody } from "@/lib/http";
import { tooMany } from "@/lib/limit";
import { createQuery } from "@/lib/store";
import { parseQuery } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  const limited = tooMany(request, "query", 5, 10 * 60 * 1000);
  if (limited) return limited;
  const body = await readBody(request);
  if (body instanceof Response) return body;
  const parsed = parseQuery(body);
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const result = await createQuery(parsed.value);
  if ("error" in result) return json({ error: result.error }, result.status);
  return json({ ok: true });
}
