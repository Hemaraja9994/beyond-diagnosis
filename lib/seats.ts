import { creSeatLimit } from "@/lib/settings";
import { paymentState, rciState } from "@/lib/status";
import { listRegistrations, type Registration } from "@/lib/store";

/**
 * RCI CRE places: the first `programme.creSeats` claimants by registration time hold a place.
 * A claimant whose payment a coordinator rejects gives the place back.
 */
export function holdsCrePlace(row: Registration): boolean {
  return row.creClaim === "yes" && paymentState(row) !== "rejected";
}

export async function creSeatsLeft(rows?: Registration[]): Promise<number> {
  const all = rows ?? (await listRegistrations());
  return Math.max(0, (await creSeatLimit()) - all.filter(holdsCrePlace).length);
}

/** Position of a claimant among place holders, oldest first (1 = first). Null if not holding a place. */
export function crePosition(rows: Registration[], reference: string): number | null {
  // Places given by a coordinator beyond the limit are recorded with source "desk" and counted like any other.
  const holders = rows.filter(holdsCrePlace).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const index = holders.findIndex((row) => row.reference === reference);
  return index === -1 ? null : index + 1;
}

export type DeskNumbers = {
  total: number;
  paymentConfirmed: number;
  paymentPending: number;
  paymentRejected: number;
  cre: {
    seats: number;
    taken: number;
    left: number;
    paymentConfirmed: number;
    rciConfirmed: number;
    rciUnderReview: number;
    rciAwaited: number;
    attended: number;
    examPassed: number;
    pointsCredited: number;
  };
  others: { total: number; paymentConfirmed: number; attended: number };
  notStated: number;
};

/** The figures for the desk dashboard. */
export function deskNumbers(rows: Registration[], seats: number): DeskNumbers {
  const claimants = rows.filter(holdsCrePlace);
  const others = rows.filter((row) => row.creClaim === "no");
  const confirmed = (row: Registration) => paymentState(row) === "confirmed";
  const attended = (row: Registration) => row.deskReview?.attendance?.decision === "attended";
  return {
    total: rows.length,
    paymentConfirmed: rows.filter(confirmed).length,
    paymentPending: rows.filter((row) => paymentState(row) === "pending").length,
    paymentRejected: rows.filter((row) => paymentState(row) === "rejected").length,
    cre: {
      seats,
      taken: claimants.length,
      left: Math.max(0, seats - claimants.length),
      paymentConfirmed: claimants.filter(confirmed).length,
      rciConfirmed: claimants.filter((row) => rciState(row) === "confirmed").length,
      rciUnderReview: claimants.filter((row) => rciState(row) === "submitted").length,
      rciAwaited: claimants.filter((row) => rciState(row) === "awaited").length,
      attended: claimants.filter(attended).length,
      examPassed: claimants.filter((row) => row.deskReview?.exam?.decision === "passed").length,
      pointsCredited: claimants.filter((row) => row.deskReview?.points?.decision === "credited").length,
    },
    others: { total: others.length, paymentConfirmed: others.filter(confirmed).length, attended: others.filter(attended).length },
    notStated: rows.filter((row) => row.creClaim !== "yes" && row.creClaim !== "no").length,
  };
}
