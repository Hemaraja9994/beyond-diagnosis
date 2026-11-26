import { readDocumentText } from "@/lib/ocr";
import { programme } from "@/lib/programme";
import { getDocument, getRegistration, paymentOwner, saveVerification, type Registration } from "@/lib/store";
import type { Verification, VerificationCheck, VerificationStatus } from "@/lib/verify-types";

/**
 * Checks one registration against its uploaded documents and saves the result.
 *
 * 1. Payment id not used by another registration.
 * 2. Razorpay lookup (only when RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set): captured, ₹354.
 * 3. Receipt read by OCR: shows ₹354, shows the payment id typed in the form, shows the name.
 * 4. CRR certificate, if uploaded: shows the CRR number and the name.
 *
 * It never rejects anyone. It sorts registrations into Verified / Needs review / Mismatch for the desk.
 */
export async function verifyRegistration(reference: string): Promise<Verification | null> {
  const registration = await getRegistration(reference);
  if (!registration) return null;
  const checks: VerificationCheck[] = [];

  // 1. Duplicate payment id
  let duplicate = false;
  if (registration.paymentReference === "") {
    checks.push({ label: "Payment id", result: "fail", note: "No payment id on this registration." });
  } else {
    const other = await paymentOwner(registration.paymentReference, registration.reference);
    duplicate = other !== null;
    checks.push(
      duplicate
        ? { label: "Payment id unique", result: "fail", note: `Same payment id is on ${other}.` }
        : { label: "Payment id unique", result: "pass", note: "Not used on any other registration." },
    );
  }

  // 2. Razorpay (optional)
  const razorpay = await razorpayCheck(registration);
  if (razorpay) checks.push(razorpay);

  // 3. Receipt
  let amountSeen = false;
  let idSeen = false;
  let readable = false;
  const receipt = await getDocument(registration.reference, "payment");
  if (!receipt) {
    checks.push({ label: "Receipt", result: razorpay?.result === "pass" ? "warn" : "fail", note: "No receipt uploaded." });
  } else {
    const text = await safeRead(receipt);
    readable = text.replace(/\s/g, "").length >= 20;
    if (!readable) {
      checks.push({
        label: "Receipt readable",
        result: "warn",
        note: receipt.contentType === "application/pdf" ? "PDF has no readable text (probably scanned)." : "Too little text could be read from the image.",
      });
    } else {
      amountSeen = showsAmount(text, programme.feeRupees);
      checks.push(
        amountSeen
          ? { label: `Amount ${programme.feeLabel}`, result: "pass", note: "Fee amount found on the receipt." }
          : { label: `Amount ${programme.feeLabel}`, result: "fail", note: "Fee amount not found on the receipt." },
      );
      idSeen = registration.paymentReference !== "" && containsLoose(text, registration.paymentReference);
      checks.push(
        idSeen
          ? { label: "Payment id on receipt", result: "pass", note: "The id typed in the form appears on the receipt." }
          : {
              label: "Payment id on receipt",
              result: "warn",
              note: "The id typed in the form was not found. The receipt may show a different id (e.g. UPI number).",
            },
      );
      checks.push(nameCheck("Name on receipt", text, registration.fullName, "Payer name differs — someone else may have paid."));
    }
  }

  // 4. CRR certificate (optional)
  const certificate = await getDocument(registration.reference, "crr");
  if (certificate) {
    const text = await safeRead(certificate);
    if (text.replace(/\s/g, "").length < 20) {
      checks.push({ label: "CRR certificate", result: "warn", note: "Could not read the certificate." });
    } else {
      const crr = /^[AB]\d+$/.test(registration.crrNumber) ? registration.crrNumber : "";
      checks.push(
        crr !== "" && containsLoose(text, crr)
          ? { label: "CRR number on certificate", result: "pass", note: `${crr} found on the certificate.` }
          : { label: "CRR number on certificate", result: "warn", note: "The CRR number in the form was not found on the certificate." },
      );
      checks.push(nameCheck("Name on certificate", text, registration.fullName, "Name on the certificate differs from the form."));
    }
  }
  // 5. RCI portal confirmation mail (optional; uploaded once RCI opens registration)
  let rci: "match" | "review" | undefined;
  const rciMail = await getDocument(registration.reference, "rci");
  if (rciMail) {
    const text = await safeRead(rciMail);
    const fromRci = /rehabilitation\s*council|\bRCI\b|rehabcouncil/i.test(text);
    const crr = /^[AB]\d+$/.test(registration.crrNumber) ? registration.crrNumber : "";
    const crrSeen = crr !== "" && containsLoose(text, crr);
    const tokens = nameTokens(registration.fullName);
    const nameSeen = tokens.length > 0 && tokens.every((token) => text.toLowerCase().includes(token));
    rci = text.replace(/\s/g, "").length >= 20 && fromRci && (crrSeen || nameSeen) ? "match" : "review";
    checks.push(
      rci === "match"
        ? { label: "RCI confirmation", result: "pass", note: `RCI mail shows ${crrSeen ? "the CRR number" : "the name"}.` }
        : { label: "RCI confirmation", result: "warn", note: "Could not match the RCI mail to this participant — open it." },
    );
  } else if (registration.creClaim === "yes") {
    checks.push({ label: "RCI confirmation", result: "warn", note: "Claiming CRE points; RCI portal confirmation not uploaded yet." });
  }

  const status = decide({ duplicate, razorpayPass: razorpay?.result === "pass", razorpayFail: razorpay?.result === "fail", readable, amountSeen, idSeen, hasReceipt: !!receipt });
  const verification: Verification = {
    status,
    ...(rci ? { rci } : {}),
    checkedAt: new Date().toISOString(),
    summary: summaryFor(status, checks),
    checks,
  };
  await saveVerification(registration.reference, verification);
  return verification;
}

function decide(input: {
  duplicate: boolean;
  razorpayPass: boolean;
  razorpayFail: boolean;
  readable: boolean;
  amountSeen: boolean;
  idSeen: boolean;
  hasReceipt: boolean;
}): VerificationStatus {
  if (input.duplicate || input.razorpayFail) return "mismatch";
  if (input.razorpayPass) return "verified";
  if (!input.hasReceipt || !input.readable) return "review";
  if (input.amountSeen && input.idSeen) return "verified";
  if (!input.amountSeen && !input.idSeen) return "mismatch";
  return "review";
}

function summaryFor(status: VerificationStatus, checks: VerificationCheck[]): string {
  const problems = checks.filter((check) => check.result !== "pass").map((check) => check.label);
  if (status === "verified" && problems.length === 0) return "Payment and details match.";
  if (status === "verified") return `Payment matches. Look at: ${problems.join(", ")}.`;
  return problems.length > 0 ? `Look at: ${problems.join(", ")}.` : "Look at the receipt.";
}

async function safeRead(file: Parameters<typeof readDocumentText>[0]): Promise<string> {
  try {
    return await readDocumentText(file);
  } catch (error) {
    console.error("verify: could not read document", error);
    return "";
  }
}

/** True when the text shows the fee, e.g. "₹354", "Rs 354.00", "INR 354". Not 1354 or 3540. */
export function showsAmount(text: string, rupees: number): boolean {
  const pattern = new RegExp(`(^|[^\\d.,])${rupees}(?:[.,]0{1,2})?(?![\\d])`, "m");
  return pattern.test(text.replace(/,(?=\d{3}\b)/g, ""));
}

/**
 * OCR often confuses O/0, I/l/1, S/5, B/8 and adds spaces inside ids ("pay _Qx7…").
 * Both sides are folded the same way before comparing.
 */
export function foldForOcr(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL|]/g, "1")
    .replace(/S/g, "5")
    .replace(/B/g, "8")
    .replace(/Z/g, "2");
}

export function containsLoose(text: string, needle: string): boolean {
  const target = foldForOcr(needle);
  if (target.length < 4) return false;
  return foldForOcr(text).includes(target);
}

const honorifics = new Set(["dr", "prof", "mr", "ms", "mrs", "miss", "shri", "smt", "kum"]);

export function nameTokens(fullName: string): string[] {
  return fullName
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((part) => part.length >= 3 && !honorifics.has(part));
}

function nameCheck(label: string, text: string, fullName: string, missingNote: string): VerificationCheck {
  const tokens = nameTokens(fullName);
  const haystack = text.toLowerCase();
  const found = tokens.filter((token) => haystack.includes(token));
  if (tokens.length > 0 && found.length === tokens.length) return { label, result: "pass", note: "Name matches." };
  if (found.length > 0) return { label, result: "pass", note: `Partly matches (${found.join(", ")}).` };
  return { label, result: "warn", note: missingNote };
}

/** Optional: ask Razorpay directly. Needs read access keys from the account that owns the payment page. */
async function razorpayCheck(registration: Registration): Promise<VerificationCheck | null> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  const id = registration.paymentReference.trim();
  if (keyId === "" || secret === "" || !/^pay_[A-Za-z0-9]{10,20}$/.test(id)) return null;
  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${id}`, {
      headers: { authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 400 || response.status === 404) {
      return { label: "Razorpay", result: "fail", note: "Razorpay has no payment with this id." };
    }
    if (!response.ok) return { label: "Razorpay", result: "warn", note: `Razorpay did not answer (${response.status}).` };
    const payment = (await response.json()) as { status?: string; amount?: number; email?: string };
    const paid = payment.status === "captured" || payment.status === "authorized";
    const amountOk = payment.amount === programme.feeRupees * 100;
    if (paid && amountOk) {
      const sameEmail = (payment.email ?? "").toLowerCase() === registration.email.toLowerCase();
      return {
        label: "Razorpay",
        result: "pass",
        note: sameEmail ? `Paid ${programme.feeLabel}, same email.` : `Paid ${programme.feeLabel}; payer email differs.`,
      };
    }
    return {
      label: "Razorpay",
      result: "fail",
      note: `Status ${payment.status ?? "unknown"}, amount ₹${((payment.amount ?? 0) / 100).toFixed(2)}.`,
    };
  } catch {
    return { label: "Razorpay", result: "warn", note: "Razorpay could not be reached." };
  }
}

