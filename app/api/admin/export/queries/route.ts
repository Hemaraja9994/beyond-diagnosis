import { adminFromRequest } from "@/lib/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { json } from "@/lib/http";
import { programme } from "@/lib/programme";
import { listQueries } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const rows = await listQueries();
  const csv = toCsv(
    ["Received at", "Name", "Email", "Topic", "Message"],
    rows.map((row) => [row.createdAt, row.fullName, row.email, row.topic, row.message]),
  );
  return csvResponse(`queries-${programme.acknowledgement}.csv`, csv);
}
