import { adminFromRequest } from "@/lib/admin";
import { csvResponse, toCsv } from "@/lib/csv";
import { json } from "@/lib/http";
import { attendanceLabel, professionLabel, programme, sourceLabel, type ArrivalSource, type Profession } from "@/lib/programme";
import { listRegistrations } from "@/lib/store";
import { paymentState, paymentText, rciState, rciText } from "@/lib/status";
import { statusLabel } from "@/lib/verify-types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!adminFromRequest(request)) return json({ error: "Sign in at the coordinator desk." }, 401);
  const rows = await listRegistrations();
  const csv = toCsv(
    [
      "Reference",
      "Registered at",
      "Title",
      "Name",
      "Email",
      "Mobile",
      "Claiming RCI CRE points",
      "CRR",
      "Category",
      "Profession written",
      "Designation",
      "Workplace",
      "State",
      "Payment reference",
      "Receipt",
      "CRR certificate",
      "RCI confirmation",
      "Payment status",
      "RCI status",
      "Automatic check",
      "Automatic check notes",
      "Checked by coordinator",
      "Webex attendance",
      "RCI online exam",
      "CRE points credited",
      "Access needs",
      "Arrived from",
      "Participant attendance (offline/online)",
    ],
    rows.map((row) => [
      row.reference,
      row.createdAt,
      row.title,
      row.fullName,
      row.email,
      row.mobile,
      row.creClaim === "yes" ? "Yes" : row.creClaim === "no" ? "No" : "Not stated",
      row.crrNumber,
      professionLabel(row.profession as Profession),
      row.professionDetail,
      row.designation,
      row.institution,
      row.stateName,
      row.paymentReference,
      row.documents.includes("payment") || row.paymentProof !== "" ? "Yes" : "No",
      row.documents.includes("crr") ? "Yes" : "No",
      row.documents.includes("rci") ? "Yes" : "No",
      paymentText[paymentState(row)],
      rciText[rciState(row)],
      statusLabel(row.verification?.status),
      row.verification?.summary ?? "",
      [row.deskReview?.payment ? `Payment: ${row.deskReview.payment.decision} by ${row.deskReview.payment.by}` : "", row.deskReview?.rci ? `RCI: ${row.deskReview.rci.decision} by ${row.deskReview.rci.by}` : ""].filter(Boolean).join("; "),
      row.deskReview?.attendance?.decision ?? "",
      row.deskReview?.exam?.decision ?? "",
      row.deskReview?.points ? "Yes" : "",
      row.accessNeeds,
      sourceLabel(row.source as ArrivalSource),
      attendanceLabel(row.attendance),
    ]),
  );
  return csvResponse(`registrations-${programme.acknowledgement}.csv`, csv);
}
