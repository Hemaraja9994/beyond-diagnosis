import { adminFromRequest } from "@/lib/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { json } from "@/lib/http";
import { professionLabel, programme, sourceLabel, type ArrivalSource, type Profession } from "@/lib/programme";
import { listRegistrations } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const rows = await listRegistrations();
  const csv = toCsv(
    [
      "Reference",
      "Registered at",
      "Name",
      "Email",
      "Mobile",
      "CRR",
      "Category",
      "Designation",
      "Institution",
      "State",
      "Payment reference",
      "Screenshot",
      "Access needs",
      "Arrived from",
    ],
    rows.map((row) => [
      row.reference,
      row.createdAt,
      row.fullName,
      row.email,
      row.mobile,
      row.crrNumber,
      professionLabel(row.profession as Profession),
      row.designation,
      row.institution,
      row.stateName,
      row.paymentReference,
      row.paymentProof === "" ? "No" : "Yes",
      row.accessNeeds,
      sourceLabel(row.source as ArrivalSource),
    ]),
  );
  return csvResponse(`registrations-${programme.acknowledgement}.csv`, csv);
}
