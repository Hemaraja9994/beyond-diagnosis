/**
 * What the automatic check found for one registration.
 *
 * verified – the receipt shows the fee and the same payment id (or Razorpay confirmed the payment)
 * review   – something could not be read or only partly matched; a coordinator should look
 * mismatch – the receipt does not show this payment, or the payment id is already used by someone else
 */
export type VerificationStatus = "verified" | "review" | "mismatch";

export type VerificationCheck = {
  label: string;
  result: "pass" | "warn" | "fail";
  note: string;
};

export type Verification = {
  status: VerificationStatus;
  /** Automatic reading of the RCI confirmation mail, when one was uploaded. */
  rci?: "match" | "review";
  checkedAt: string;
  summary: string;
  checks: VerificationCheck[];
};

export function statusLabel(status: VerificationStatus | undefined): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "review":
      return "Needs review";
    case "mismatch":
      return "Mismatch";
    default:
      return "Not checked";
  }
}

/** A coordinator's own decision. It always wins over the automatic check. */
export type DeskDecision = { decision: string; by: string; at: string };
export type DeskReview = {
  payment?: DeskDecision & { decision: "verified" | "rejected"; /** Verified although the automatic check had not passed. */ override?: boolean };
  rci?: DeskDecision & { decision: "confirmed" | "rejected" };
  /** Attended the Webex sessions (e.g. from the Webex attendance report). */
  attendance?: DeskDecision & { decision: "attended" | "absent" };
  /** Online examination conducted by RCI after the sessions. */
  exam?: DeskDecision & { decision: "passed" | "not-passed" | "not-taken" };
  /** CRE points shown on the participant's own profile on the RCI website. */
  points?: DeskDecision & { decision: "credited" };
  /** When each confirmation email went out (ISO time), so none is sent twice. */
  mailed?: { registration?: string; payment?: string; rci?: string; certificate?: string };
  /** E-certificate of participation: its number, fixed the first time it is issued. */
  certificate?: { number: number; issuedAt: string };
  /** Change log: who changed what on this registration, newest last (kept to the last 60 entries). */
  history?: { by: string; at: string; what: string }[];
};

export function withHistory(review: DeskReview, by: string, what: string): DeskReview {
  const history = [...(review.history ?? []), { by, at: new Date().toISOString(), what }].slice(-60);
  return { ...review, history };
}

export type DeskField = Exclude<keyof DeskReview, "mailed" | "history" | "certificate">;
