export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function readBody(request: Request): Promise<unknown | Response> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 20_000) return json({ error: "That submission is too large." }, 413);
  try {
    return await request.json();
  } catch {
    return json({ error: "The form could not be read." }, 400);
  }
}
