import { adminFromRequest } from "@/lib/admin";
import { json } from "@/lib/http";
import { extensionFor, isDocKind } from "@/lib/proof";
import { getDocument } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ reference: string; kind: string }> }) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const { reference, kind } = await context.params;
  const key = reference.toUpperCase();
  if (!/^YDU-[A-Z2-9]{12}$/.test(key) || !isDocKind(kind)) return json({ error: "That file was not found." }, 404);
  const file = await getDocument(key, kind);
  if (!file) return json({ error: "No file of that kind on this registration." }, 404);
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "content-type": file.contentType,
      "cache-control": "private, no-store",
      "content-disposition": `inline; filename="${key}-${kind}.${extensionFor(file.contentType)}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
