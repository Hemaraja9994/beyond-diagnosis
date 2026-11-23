/** Older link kept working: forwards to the receipt. */
export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params;
  return Response.redirect(new URL(`/api/admin/file/${encodeURIComponent(reference)}/payment`, request.url), 302);
}
