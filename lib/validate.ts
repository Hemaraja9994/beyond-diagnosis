import { professions, states, titles, type ArrivalSource, type CreClaim, type Profession, type Title } from "@/lib/programme";

export type RegistrationDraft = {
  title: Title;
  creClaim: CreClaim;
  fullName: string;
  email: string;
  mobile: string;
  crrNumber: string;
  profession: Profession;
  professionDetail: string;
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
const sources = new Set<string>(["rci", "site", "join", "direct", "desk"]);
const titleValues = new Set<string>(titles);

/** Turn the text fields of a multipart form into a plain record (files are read separately). */
export function formRecord(form: FormData): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") record[key] = value;
  }
  record.consent = form.get("consent") === "on" || form.get("consent") === "true";
  return record;
}

/** Razorpay payment id (pay_…) or a UPI / bank transaction number. */
export function normalisePaymentReference(input: string): string | null {
  const value = input.trim().replace(/\s+/g, "");
  if (value.length < 6 || value.length > 64 || /[^A-Za-z0-9_./-]/.test(value)) return null;
  return value;
}

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

  const titleRaw = readString(record, "title");
  const creRaw = readString(record, "creClaim");
  const fullName = readString(record, "fullName");
  const email = readString(record, "email").toLowerCase();
  const mobile = normaliseMobile(readString(record, "mobile"));
  const professionRaw = readString(record, "profession");
  const professionDetail = readString(record, "professionDetail");
  const designation = readString(record, "designation");
  const institution = readString(record, "institution");
  const stateName = readString(record, "stateName");
  const paymentReference = normalisePaymentReference(readString(record, "paymentReference"));
  const accessNeeds = readString(record, "accessNeeds");
  const sourceRaw = readString(record, "source") || "direct";
  const consent = record.consent === true;
  const claiming = creRaw === "yes";
  const crrRaw = readString(record, "crrNumber");
  const crrNumber = crrRaw === "" && !claiming ? "Not applicable" : normaliseCrr(crrRaw);

  if (!titleValues.has(titleRaw)) return { error: "Choose a title: Dr., Prof., Mr., Ms. or Mrs." };
  if (creRaw !== "yes" && creRaw !== "no") return { error: "Say whether you will claim RCI CRE points." };
  if (!validName(fullName)) return { error: "Enter the name as it should appear on the certificate, using letters only." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (!mobile) return { error: "Enter a 10-digit Indian mobile number." };
  if (!professionValues.has(professionRaw)) return { error: "Choose a professional category." };
  if (professionRaw === "other" && (professionDetail.length < 2 || professionDetail.length > 80)) {
    return { error: "Write the profession in a few words." };
  }
  if (!crrNumber) {
    return {
      error: claiming
        ? "To claim RCI CRE points, enter your CRR number in the form A followed by digits."
        : "Enter the CRR number in the form A followed by digits, or leave it blank.",
    };
  }
  if (designation.length > 120) return { error: "The designation is too long." };
  if (institution.length < 2 || institution.length > 160) return { error: "Enter the workplace." };
  if (!stateValues.has(stateName)) return { error: "Choose a state or Union Territory." };
  if (!paymentReference) {
    return { error: "Enter the Razorpay payment id (pay_…) or the UPI transaction number from your receipt." };
  }
  if (accessNeeds.length > 500) return { error: "Shorten the note on access needs to 500 characters." };
  if (!sources.has(sourceRaw)) return { error: "The registration source was not recognised." };
  if (!consent) return { error: "Confirm that the details may be kept for this CRE programme." };

  const profession = professionRaw as Profession;
  const source = sourceRaw as ArrivalSource;
  return {
    value: {
      title: titleRaw as Title,
      creClaim: creRaw as CreClaim,
      fullName,
      email,
      mobile,
      crrNumber,
      profession,
      professionDetail: profession === "other" ? professionDetail : "",
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

export type UpdateDraft = {
  reference: string;
  email: string;
  title: Title | "";
  creClaim: CreClaim | "";
  crrNumber: string;
  paymentReference: string;
};

/** Fields a participant may add or correct later, found by reference and email. Blank means "leave as it is". */
export function parseUpdate(record: Record<string, unknown>): { value: UpdateDraft } | { error: string } {
  const reference = readString(record, "reference").toUpperCase();
  const email = readString(record, "email").toLowerCase();
  const title = readString(record, "title");
  const creClaim = readString(record, "creClaim");
  const crrRaw = readString(record, "crrNumber");
  const paymentRaw = readString(record, "paymentReference");
  if (!/^YDU-[A-Z2-9]{12}$/.test(reference)) return { error: "Enter the registration reference (YDU-…) from your confirmation." };
  if (!validEmail(email)) return { error: "Enter the email used at registration." };
  if (title !== "" && !titleValues.has(title)) return { error: "Choose a title from the list." };
  if (creClaim !== "" && creClaim !== "yes" && creClaim !== "no") return { error: "Say whether you will claim RCI CRE points." };
  const crrNumber = crrRaw === "" ? "" : normaliseCrr(crrRaw);
  if (crrNumber === null) return { error: "Enter the CRR number in the form A followed by digits." };
  const paymentReference = paymentRaw === "" ? "" : normalisePaymentReference(paymentRaw);
  if (paymentReference === null) {
    return { error: "The payment id can use letters, numbers, and simple punctuation only." };
  }
  return {
    value: {
      reference,
      email,
      title: title as Title | "",
      creClaim: creClaim as CreClaim | "",
      crrNumber,
      paymentReference,
    },
  };
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

/** Checks for a coordinator's edit: the same rules as the public form, but nothing is mandatory that a desk may not know. */
export function parseDeskEdit(record: Record<string, unknown>):
  | { value: import("@/lib/store").DeskEdit }
  | { error: string } {
  const title = readString(record, "title");
  const creClaim = readString(record, "creClaim");
  const fullName = readString(record, "fullName");
  const email = readString(record, "email").toLowerCase();
  const mobileRaw = readString(record, "mobile");
  const mobile = normaliseMobile(mobileRaw) ?? (/^\+?[\d\s-]{8,18}$/.test(mobileRaw) ? mobileRaw.replace(/[\s-]/g, "") : null);
  const profession = readString(record, "profession");
  const professionDetail = readString(record, "professionDetail");
  const crrRaw = readString(record, "crrNumber");
  const crrNumber = crrRaw === "" || /^not applicable$/i.test(crrRaw) ? (creClaim === "yes" ? null : "Not applicable") : normaliseCrr(crrRaw);
  const paymentRaw = readString(record, "paymentReference");
  const paymentReference = paymentRaw === "" ? "" : normalisePaymentReference(paymentRaw);
  if (title !== "" && !titleValues.has(title)) return { error: "Choose a title from the list." };
  if (creClaim !== "yes" && creClaim !== "no" && creClaim !== "") return { error: "Choose whether CRE points are claimed." };
  if (!validName(fullName)) return { error: "Enter the name using letters only." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (!mobile) return { error: "Enter a mobile number." };
  if (!professionValues.has(profession)) return { error: "Choose a professional category." };
  if (!crrNumber) return { error: "A CRE claimant needs a CRR number (A followed by digits)." };
  if (paymentReference === null) return { error: "The payment ID can use letters, numbers, and simple punctuation only." };
  const stateName = readString(record, "stateName");
  if (!stateValues.has(stateName)) return { error: "Choose a state or Union Territory." };
  return {
    value: {
      title: title as Title | "",
      creClaim: creClaim as CreClaim | "",
      fullName,
      email,
      mobile,
      crrNumber,
      profession: profession as Profession,
      professionDetail: profession === "other" ? professionDetail.slice(0, 80) : "",
      designation: readString(record, "designation").slice(0, 120),
      institution: readString(record, "institution").slice(0, 160),
      stateName,
      paymentReference,
      accessNeeds: readString(record, "accessNeeds").slice(0, 500),
    },
  };
}
