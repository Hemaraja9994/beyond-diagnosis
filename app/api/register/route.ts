import { sameOrigin } from "@/lib/admin";
import { json, readBody } from "@/lib/http";
import { createRegistration } from "@/lib/store";
import { parseRegistration } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Submit the form from this website." }, 403);
  const body = await readBody(request);
  if (body instanceof Response) return body;
  const parsed = parseRegistration(body);
  if ("error" in parsed) return json({ error: parsed.error }, 400);
  const result = await createRegistration(parsed.value);
  if ("error" in result) return json({ error: result.error }, result.status);
  return json({ reference: result.reference });
}
