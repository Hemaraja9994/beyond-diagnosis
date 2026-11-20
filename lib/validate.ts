import { professions, states, type ArrivalSource, type Profession } from "@/lib/programme";

export type RegistrationDraft = {
  fullName: string;
  email: string;
  mobile: string;
  crrNumber: string;
  profession: Profession;
  designation: string;
  institution: string;
  stateName: string;
  paymentReference: string;
  accessNeeds: string;
  source: ArrivalSource;
  consent: boolean;
};

export type QueryDraft = {
  fullName: string;
  email: string;
  topic: string;
  message: string;
};

const professionValues = new Set<string>(professions.map((item) => item.value));
const stateValues = new Set<string>(states);
const sources = new Set<string>(["rci", "site", "join", "direct"]);

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(email: string): boolean {
  return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validName(name: string): boolean {
  return /^[\p{L}\p{M} .'-]{2,120}$/u.test(name);
}

export function normaliseMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export function normaliseCrr(input: string): string | null {
  const value = input.toUpperCase().replace(/\s/g, "");
  return /^A\d{3,8}$/.test(value) ? value : null;
}

export function parseRegistration(body: unknown): { value: RegistrationDraft } | { error: string } {
  const record = asRecord(body);
  if (!record) return { error: "The registration could not be read." };
  if (readString(record, "fax_number") !== "") return { error: "The registration could not be accepted." };

  const fullName = readString(record, "fullName");
  const email = readString(record, "email").toLowerCase();
  const mobile = normaliseMobile(readString(record, "mobile"));
  const professionRaw = readString(record, "profession");
  const designation = readString(record, "designation");
  const institution = readString(record, "institution");
  const stateName = readString(record, "stateName");
  const paymentReference = readString(record, "paymentReference");
  const accessNeeds = readString(record, "accessNeeds");
  const sourceRaw = readString(record, "source") || "direct";
  const consent = record.consent === true;
  const student = professionRaw === "student";
  const crrRaw = readString(record, "crrNumber");
  const crrNumber = crrRaw === "" && student ? "Not applicable" : normaliseCrr(crrRaw);

  if (!validName(fullName)) return { error: "Enter the name as it should appear on the certificate, using letters only." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (!mobile) return { error: "Enter a 10-digit Indian mobile number." };
  if (!professionValues.has(professionRaw)) return { error: "Choose a professional category." };
  if (!crrNumber) return { error: "Enter the CRR number in the form A followed by digits. Students may leave it blank." };
  if (designation.length > 120) return { error: "The designation is too long." };
  if (institution.length < 2 || institution.length > 160) return { error: "Enter the institution or place of work." };
  if (!stateValues.has(stateName)) return { error: "Choose a state or Union Territory." };
  if (paymentReference.length > 64 || /[^A-Za-z0-9 _./-]/.test(paymentReference)) {
    return { error: "The payment reference can use letters, numbers, and simple punctuation only." };
  }
  if (accessNeeds.length > 500) return { error: "Shorten the note on access needs to 500 characters." };
  if (!sources.has(sourceRaw)) return { error: "The registration source was not recognised." };
  if (!consent) return { error: "Confirm that the details may be kept for this CRE programme." };

  const profession = professionRaw as Profession;
  const source = sourceRaw as ArrivalSource;
  return {
    value: {
      fullName,
      email,
      mobile,
      crrNumber,
      profession,
      designation,
      institution,
      stateName,
      paymentReference,
      accessNeeds,
      source,
      consent,
    },
  };
}

export function parseQuery(body: unknown): { value: QueryDraft } | { error: string } {
  const record = asRecord(body);
  if (!record) return { error: "The message could not be read." };
  if (readString(record, "fax_number") !== "") return { error: "The message could not be accepted." };
  const fullName = readString(record, "fullName");
  const email = readString(record, "email").toLowerCase();
  const topic = readString(record, "topic");
  const message = readString(record, "message");
  if (!validName(fullName)) return { error: "Enter your name." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (topic.length < 3 || topic.length > 140) return { error: "Add a short topic, up to 140 characters." };
  if (message.length < 10 || message.length > 2000) return { error: "Write the query in 10 to 2000 characters." };
  return { value: { fullName, email, topic, message } };
}

export function parsePaymentFields(input: {
  reference: string;
  email: string;
  paymentReference: string;
  hasProof: boolean;
}): { reference: string; email: string; paymentReference: string } | { error: string } {
  const reference = input.reference.trim().toUpperCase();
  const email = input.email.trim().toLowerCase();
  const paymentReference = input.paymentReference.trim();
  if (!/^YDU-[A-Z2-9]{12}$/.test(reference)) return { error: "Enter the registration reference from your confirmation." };
  if (!validEmail(email)) return { error: "Enter the email used at registration." };
  if (paymentReference !== "" && (paymentReference.length < 4 || paymentReference.length > 64 || /[^A-Za-z0-9 _./-]/.test(paymentReference))) {
    return { error: "The payment id can use letters, numbers, and simple punctuation only." };
  }
  if (paymentReference === "" && !input.hasProof) {
    return { error: "Add the Razorpay payment id, or upload a screenshot of the payment." };
  }
  return { reference, email, paymentReference };
}

export function isWebexUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "webex.com" || host.endsWith(".webex.com"));
  } catch {
    return false;
  }
}
