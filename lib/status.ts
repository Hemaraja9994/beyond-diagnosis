import { programme } from "@/lib/programme";
import type { DeskReview, Verification } from "@/lib/verify-types";

/**
 * What a participant (and the acknowledgement PDF) is told. Shared by the desk, the status page and the PDF.
 * A coordinator's decision wins; otherwise the automatic check decides. An automatic "mismatch" is never shown
 * to the participant as a rejection — only a coordinator can reject.
 */
export type PaymentState = "confirmed" | "pending" | "rejected";
export type RciState = "not-claiming" | "not-stated" | "awaited" | "submitted" | "confirmed" | "rejected";

type StatusInput = {
  creClaim: string;
  documents: string[];
  verification: Verification | null;
  deskReview: DeskReview | null;
};

export function paymentState(row: StatusInput): PaymentState {
  const desk = row.deskReview?.payment?.decision;
  if (desk === "verified") return "confirmed";
  if (desk === "rejected") return "rejected";
  return row.verification?.status === "verified" ? "confirmed" : "pending";
}

export function rciState(row: StatusInput): RciState {
  if (row.creClaim === "no") return "not-claiming";
  if (row.creClaim !== "yes") return "not-stated";
  const desk = row.deskReview?.rci?.decision;
  if (desk === "confirmed") return "confirmed";
  if (desk === "rejected") return "rejected";
  if (!row.documents.includes("rci")) return "awaited";
  return row.verification?.rci === "match" ? "confirmed" : "submitted";
}

export const paymentText: Record<PaymentState, string> = {
  confirmed: `Paid — ${programme.feeLabel} confirmed`,
  pending: "Payment under verification",
  rejected: "Payment not confirmed — please contact the organisers",
};

export const rciText: Record<RciState, string> = {
  "not-claiming": "Not claiming RCI CRE points",
  "not-stated": "CRE points: not stated",
  awaited: "RCI portal confirmation awaited",
  submitted: "RCI confirmation received — under review",
  confirmed: "RCI registration confirmed",
  rejected: "RCI confirmation not accepted — please contact the organisers",
};

/** One word for the stamp. */
export function overallState(row: StatusInput): { word: string; tone: "ok" | "wait" | "stop" } {
  const pay = paymentState(row);
  const rci = rciState(row);
  if (pay === "rejected" || rci === "rejected") return { word: "ACTION NEEDED", tone: "stop" };
  if (pay !== "confirmed") return { word: "REGISTERED", tone: "wait" };
  if (rci === "awaited" || rci === "submitted") return { word: "PAID", tone: "wait" };
  return { word: "CONFIRMED", tone: "ok" };
}

export type JourneyStep = { title: string; state: "done" | "now" | "later" | "no"; note: string };

/** The participant's own CRE journey, shown on the status page and (briefly) in the acknowledgement. */
export function creJourney(row: StatusInput): JourneyStep[] {
  const pay = paymentState(row);
  const rci = rciState(row);
  const att = row.deskReview?.attendance?.decision;
  const exam = row.deskReview?.exam?.decision;
  const points = row.deskReview?.points?.decision;
  const claiming = row.creClaim === "yes";
  const steps: JourneyStep[] = [
    { title: "Registered on this site", state: "done", note: "Reference issued." },
    { title: "Payment", state: pay === "confirmed" ? "done" : pay === "rejected" ? "no" : "now", note: paymentText[pay] },
  ];
  if (claiming) {
    steps.push({
      title: "Registered on the RCI website",
      state: rci === "confirmed" ? "done" : rci === "rejected" ? "no" : rci === "submitted" ? "now" : "later",
      note: rciText[rci],
    });
  }
  steps.push({
    title: "Attended on Cisco Webex",
    state: att === "attended" ? "done" : att === "absent" ? "no" : "later",
    note: att === "attended" ? "Attendance recorded." : att === "absent" ? "Attendance not recorded — contact the organisers." : `On ${programme.dateLabel}. Slido runs inside Webex.`,
  });
  if (claiming) {
    steps.push({
      title: "Online examination by RCI",
      state: exam === "passed" ? "done" : exam === "not-passed" || exam === "not-taken" ? "no" : "later",
      note:
        exam === "passed"
          ? "Completed."
          : exam === "not-passed"
            ? "Not cleared, as reported by RCI."
            : exam === "not-taken"
              ? "Not taken, as reported by RCI."
              : "Conducted by RCI after the sessions.",
    });
    steps.push({
      title: "CRE points on your RCI profile",
      state: points === "credited" ? "done" : "later",
      note: points === "credited" ? "Credited by RCI — see your profile on the RCI website." : "Credited by RCI to your profile on the RCI website after it processes the programme.",
    });
  }
  return steps;
}
