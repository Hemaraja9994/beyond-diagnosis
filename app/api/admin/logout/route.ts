import { clearSessionCookie, sameOrigin } from "@/lib/admin";
import { json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Sign out from this website." }, 403);
  return new Response(null, {
    status: 303,
    headers: { location: "/admin", "set-cookie": clearSessionCookie(), "cache-control": "no-store" },
  });
}
