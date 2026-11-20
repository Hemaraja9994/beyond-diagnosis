export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

const bodyLimit = 20_000;

export async function readBody(request: Request): Promise<unknown | Response> {
  if (!request.body) return json({ error: "The form could not be read." }, 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > bodyLimit) {
        await reader.cancel();
        return json({ error: "That submission is too large." }, 413);
      }
      chunks.push(value);
    }
  } catch {
    return json({ error: "The form could not be read." }, 400);
  }
  const text = new TextDecoder().decode(concat(chunks));
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return json({ error: "The form could not be read." }, 400);
  }
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const body = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
