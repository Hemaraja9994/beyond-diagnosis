import { adminFromRequest } from "@/lib/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { json } from "@/lib/http";
import { professionLabel, programme, type Profession } from "@/lib/programme";
import { listRegistrations } from "@/lib/store";
import { paymentState, paymentText, rciState, rciText } from "@/lib/status";

export const runtime = "nodejs";

/**
 * Participants claiming RCI CRE points, for the RCI portal.
 * ?all=1 includes those whose payment is not yet confirmed; by default only payment-confirmed rows are listed.
 * Column order can be changed to RCI's template once the programme is approved.
 */
export async function GET(request: Request) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const all = new URL(request.url).searchParams.get("all") === "1";
  const rows = (await listRegistrations())
    .filter((row) => row.creClaim === "yes")
    .filter((row) => all || paymentState(row) === "confirmed")
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const csv = toCsv(
    ["Sl. No.", "Title", "Name as on CRR", "CRR number", "Category", "Email", "Mobile", "State", "Workplace", "RCI status", "Payment status", "Reference"],
    rows.map((row, index) => [
      String(index + 1),
      row.title,
      row.fullName,
      row.crrNumber,
      professionLabel(row.profession as Profession),
      row.email,
      row.mobile,
      row.stateName,
      row.institution,
      rciText[rciState(row)],
      paymentText[paymentState(row)],
      row.reference,
    ]),
  );
  return csvResponse(`rci-cre-participants-${programme.acknowledgement}${all ? "-all" : ""}.csv`, csv);
}
