import { createHash, randomBytes, randomUUID } from "node:crypto";
import { get, list, put } from "@vercel/blob";
import { sql, storageMode } from "@/lib/db";
import type { ArrivalSource, CreClaim, Profession, Title } from "@/lib/programme";
import { isDocKind, isProofKind, type DocKind, type ProofFile } from "@/lib/proof";
import type { QueryDraft, RegistrationDraft, UpdateDraft } from "@/lib/validate";
import type { DeskReview, Verification } from "@/lib/verify-types";

export { storageMode };

export type Registration = {
  id: string;
  reference: string;
  createdAt: string;
  title: Title | "";
  creClaim: CreClaim | "";
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
  /** Content type of a payment screenshot saved by the older flow; kept so those rows still open. */
  paymentProof: string;
  documents: DocKind[];
  verification: Verification | null;
  deskReview: DeskReview | null;
  accessNeeds: string;
  source: ArrivalSource;
  consent: boolean;
};

export type DocumentUpload = { kind: DocKind; file: ProofFile };

export type QueryRecord = {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  topic: string;
  message: string;
};

type StoreError = { error: string; status: number };
const duplicateMessage = "Registration could not be completed with these details. If you registered before, use “Update my registration”.";
const capacityMessage = "Registration is full. Write to the conference email and the organising team will help.";
const pauseMessage = "Registration is paused for a short while. Try again later or write to the conference email.";
const updateMessage = "No registration matches that reference and email.";
const paymentLocked = "A different payment id is already saved for this registration. Write to the conference email to change it.";
const paymentUsed = "This payment id is already used on another registration. Each participant needs their own payment.";
let columnsReady = false;
const hourlyCap = 40;
const pace: Record<"registrations" | "queries", number[]> = { registrations: [], queries: [] };

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */

export async function createRegistration(
  draft: RegistrationDraft,
  uploads: DocumentUpload[],
): Promise<{ reference: string } | StoreError> {
  if (await paymentOwner(draft.paymentReference)) return { error: paymentUsed, status: 400 };
  const created = storageMode() === "blob" ? await createRegistrationBlob(draft) : await createRegistrationSql(draft);
  if ("error" in created) return created;
  for (const upload of uploads) await saveDocument(created.reference, upload);
  return created;
}

export async function listRegistrations(): Promise<Registration[]> {
  if (storageMode() === "blob") return listJson("registrations/", parseRegistration);
  await ensureColumns();
  const rows = await sql<Record<string, unknown>>(`select ${registrationColumns} from registrations order by created_at desc`);
  return rows.map(registrationFromRow);
}

export async function getRegistration(reference: string): Promise<Registration | null> {
  if (storageMode() === "blob") return readJson(`registrations/${reference}.json`, parseRegistration);
  await ensureColumns();
  const rows = await sql<Record<string, unknown>>(`select ${registrationColumns} from registrations where reference = $1`, [
    reference,
  ]);
  return rows[0] ? registrationFromRow(rows[0]) : null;
}

/** Reference of the registration that already uses this payment id, if any. */
export async function paymentOwner(paymentReference: string, except = ""): Promise<string | null> {
  const key = paymentKey(paymentReference);
  if (key === "") return null;
  if (storageMode() === "blob") {
    const owner = await readText(`payment-index/${hash(key)}.txt`);
    return owner && owner !== except ? owner : null;
  }
  await ensureColumns();
  const rows = await sql<{ reference: string }>(
    "select reference from registrations where upper(regexp_replace(payment_reference, '\\s', '', 'g')) = $1 and reference <> $2 limit 1",
    [key, except],
  );
  return rows[0]?.reference ?? null;
}

/** A participant adds or corrects details later (older registrations, or the RCI confirmation once RCI opens). */
export async function updateRegistration(
  draft: UpdateDraft,
  uploads: DocumentUpload[],
): Promise<{ ok: true; registration: Registration } | StoreError> {
  const current = await getRegistration(draft.reference);
  if (!current || current.email.toLowerCase() !== draft.email) return { error: updateMessage, status: 400 };

  let paymentReference = current.paymentReference;
  if (draft.paymentReference !== "") {
    if (current.paymentReference !== "" && paymentKey(current.paymentReference) !== paymentKey(draft.paymentReference)) {
      return { error: paymentLocked, status: 400 };
    }
    if (await paymentOwner(draft.paymentReference, current.reference)) return { error: paymentUsed, status: 400 };
    paymentReference = draft.paymentReference;
  }
  const creClaim = draft.creClaim || current.creClaim;
  let crrNumber = draft.crrNumber || current.crrNumber;
  if (creClaim === "yes" && !/^A\d{3,8}$/.test(crrNumber)) {
    return { error: "To claim RCI CRE points, add your CRR number (A followed by digits).", status: 400 };
  }
  if (creClaim === "no" && draft.crrNumber === "" && crrNumber === "") crrNumber = "Not applicable";
  const title = draft.title || current.title;

  const next: Registration = { ...current, title, creClaim, crrNumber, paymentReference };
  if (storageMode() === "blob") {
    await writeRegistrationBlob(next);
    if (paymentReference !== current.paymentReference) await indexPayment(paymentReference, current.reference);
  } else {
    await sql(
      "update registrations set title = $1, cre_claim = $2, crr_number = $3, payment_reference = $4 where reference = $5",
      [title, creClaim, crrNumber, paymentReference, current.reference],
    );
  }
  for (const upload of uploads) await saveDocument(current.reference, upload);
  const fresh = await getRegistration(current.reference);
  return { ok: true, registration: fresh ?? next };
}

export async function saveVerification(reference: string, verification: Verification): Promise<void> {
  if (storageMode() === "blob") {
    const record = await getRegistration(reference);
    if (!record) return;
    record.verification = verification;
    await writeRegistrationBlob(record);
    return;
  }
  await ensureColumns();
  await sql("update registrations set verification = $1 where reference = $2", [JSON.stringify(verification), reference]);
}

export async function saveDeskReview(reference: string, review: DeskReview): Promise<void> {
  const empty = Object.values(review).every((value) => !value);
  if (storageMode() === "blob") {
    const record = await getRegistration(reference);
    if (!record) return;
    record.deskReview = empty ? null : review;
    await writeRegistrationBlob(record);
    return;
  }
  await ensureColumns();
  await sql("update registrations set desk_review = $1 where reference = $2", [empty ? "" : JSON.stringify(review), reference]);
}

/* Coordinator passwords: only a scrypt hash is stored, never the password. */
export async function getDeskPasswordHash(username: string): Promise<string | null> {
  if (storageMode() === "blob") return readText(`settings/desk-password-${username}.txt`);
  const rows = await sql<{ value: string }>("select value from settings where key = $1", [`desk_password:${username}`]);
  return rows[0]?.value || null;
}

export async function setDeskPasswordHash(username: string, hashValue: string): Promise<void> {
  if (storageMode() === "blob") {
    await put(`settings/desk-password-${username}.txt`, hashValue, { access: "private", contentType: "text/plain", allowOverwrite: true });
    return;
  }
  await sql(
    "insert into settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value",
    [`desk_password:${username}`, hashValue],
  );
}

export async function getDocument(reference: string, kind: DocKind): Promise<ProofFile | null> {
  if (storageMode() === "blob") {
    const record = await getRegistration(reference);
    if (!record) return null;
    if (record.documents.includes(kind)) {
      const file = await readBlobFile(`files/${reference}/${kind}`);
      if (file) return file;
    }
    if (kind === "payment" && record.paymentProof !== "") return readBlobFile(`payments/${reference}`);
    return null;
  }
  await ensureColumns();
  const rows = await sql<{ content_type: string; data: string }>(
    "select content_type, data from registration_files where reference = $1 and kind = $2",
    [reference, kind],
  );
  const row = rows[0];
  if (row && isProofKind(row.content_type)) return { contentType: row.content_type, bytes: Buffer.from(row.data, "base64") };
  if (kind !== "payment") return null;
  const legacy = await sql<{ payment_proof: string; payment_proof_data: string }>(
    "select payment_proof, payment_proof_data from registrations where reference = $1",
    [reference],
  );
  const old = legacy[0];
  if (!old || old.payment_proof_data === "" || !isProofKind(old.payment_proof)) return null;
  return { contentType: old.payment_proof, bytes: Buffer.from(old.payment_proof_data, "base64") };
}

/** Kept for the older admin link /api/admin/payment-proof/… */
export async function getPaymentProof(reference: string): Promise<ProofFile | null> {
  return getDocument(reference, "payment");
}

async function saveDocument(reference: string, upload: DocumentUpload): Promise<void> {
  if (storageMode() === "blob") {
    await put(`files/${reference}/${upload.kind}`, upload.file.bytes, {
      access: "private",
      contentType: upload.file.contentType,
      allowOverwrite: true,
    });
    const record = await getRegistration(reference);
    if (!record) return;
    if (!record.documents.includes(upload.kind)) record.documents = [...record.documents, upload.kind];
    record.verification = null;
    await writeRegistrationBlob(record);
    return;
  }
  await ensureColumns();
  await sql(
    `insert into registration_files (reference, kind, content_type, data) values ($1, $2, $3, $4)
     on conflict (reference, kind) do update set content_type = excluded.content_type, data = excluded.data, created_at = now()`,
    [reference, upload.kind, upload.file.contentType, upload.file.bytes.toString("base64")],
  );
  const rows = await sql<{ documents: string }>("select documents from registrations where reference = $1", [reference]);
  const kinds = new Set(splitKinds(rows[0]?.documents ?? ""));
  kinds.add(upload.kind);
  await sql("update registrations set documents = $1, verification = '' where reference = $2", [[...kinds].join(","), reference]);
}

const registrationColumns =
  "id, reference, created_at, title, cre_claim, full_name, email, mobile, crr_number, profession, profession_detail, designation, institution, state_name, payment_reference, payment_proof, documents, verification, desk_review, access_needs, source, consent";

async function ensureColumns(): Promise<void> {
  if (columnsReady || storageMode() === "blob") return;
  await sql("alter table registrations add column if not exists payment_proof text not null default ''");
  await sql("alter table registrations add column if not exists payment_proof_data text not null default ''");
  await sql("alter table registrations add column if not exists profession_detail text not null default ''");
  await sql("alter table registrations add column if not exists title text not null default ''");
  await sql("alter table registrations add column if not exists cre_claim text not null default ''");
  await sql("alter table registrations add column if not exists documents text not null default ''");
  await sql("alter table registrations add column if not exists verification text not null default ''");
  await sql("alter table registrations add column if not exists desk_review text not null default ''");
  await sql(
    `create table if not exists registration_files (
      reference text not null, kind text not null, content_type text not null, data text not null,
      created_at timestamptz not null default now(), primary key (reference, kind))`,
  );
  columnsReady = true;
}

async function createRegistrationSql(draft: RegistrationDraft): Promise<{ reference: string } | StoreError> {
  await ensureColumns();
  if (!withinHourlyPace("registrations")) return { error: pauseMessage, status: 429 };
  if ((await countOf("registrations")) >= 2000) return { error: capacityMessage, status: 429 };
  if ((await countRecent("registrations")) >= hourlyCap) return { error: pauseMessage, status: 429 };
  const reference = makeReference();
  const record = toRegistration(draft, reference);
  try {
    await sql(
      `insert into registrations (
        id, reference, created_at, title, cre_claim, full_name, email, mobile, crr_number, profession, profession_detail,
        designation, institution, state_name, payment_reference, access_needs, source, consent
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        record.id,
        record.reference,
        record.createdAt,
        record.title,
        record.creClaim,
        record.fullName,
        record.email,
        record.mobile,
        record.crrNumber,
        record.profession,
        record.professionDetail,
        record.designation,
        record.institution,
        record.stateName,
        record.paymentReference,
        record.accessNeeds,
        record.source,
        record.consent,
      ],
    );
  } catch (error) {
    if (isUniqueViolation(error)) return { error: duplicateMessage, status: 400 };
    throw error;
  }
  return { reference };
}

async function createRegistrationBlob(draft: RegistrationDraft): Promise<{ reference: string } | StoreError> {
  if (!withinHourlyPace("registrations")) return { error: pauseMessage, status: 429 };
  const existing = await listAll("registrations/");
  if (existing.length >= 2000) return { error: capacityMessage, status: 429 };
  const emailPath = `email-index/${hash(draft.email)}.txt`;
  const prior = await get(emailPath, { access: "private", useCache: false });
  if (prior?.statusCode === 200) return { error: duplicateMessage, status: 400 };
  const record = toRegistration(draft, makeReference());
  await put(`registrations/${record.reference}.json`, JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: false,
  });
  await put(emailPath, record.reference, { access: "private", contentType: "text/plain", allowOverwrite: false });
  await indexPayment(record.paymentReference, record.reference);
  return { reference: record.reference };
}

async function writeRegistrationBlob(record: Registration): Promise<void> {
  await put(`registrations/${record.reference}.json`, JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

async function indexPayment(paymentReference: string, reference: string): Promise<void> {
  const key = paymentKey(paymentReference);
  if (key === "") return;
  await put(`payment-index/${hash(key)}.txt`, reference, { access: "private", contentType: "text/plain", allowOverwrite: true });
}

async function readBlobFile(pathname: string): Promise<ProofFile | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const contentType = result.blob.contentType ?? "";
  if (!isProofKind(contentType)) return null;
  return { contentType, bytes: Buffer.from(await new Response(result.stream).arrayBuffer()) };
}

/** Payment ids compared without spaces and case, so "pay_ABC" and "PAY_abc " are the same payment. */
export function paymentKey(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function splitKinds(value: string): DocKind[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(isDocKind);
}

function toRegistration(draft: RegistrationDraft, reference: string): Registration {
  return {
    id: randomUUID(),
    reference,
    createdAt: new Date().toISOString(),
    paymentProof: "",
    documents: [],
    verification: null,
    deskReview: null,
    ...draft,
  };
}

/* ------------------------------------------------------------------ */
/* Queries and settings                                                */
/* ------------------------------------------------------------------ */

export async function createQuery(draft: QueryDraft): Promise<{ ok: true } | StoreError> {
  const record: QueryRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...draft,
  };
  if (!withinHourlyPace("queries")) {
    return { error: "The query box is paused for a short while. Try again later or email the conference address.", status: 429 };
  }
  if (storageMode() === "blob") {
    const existing = await listAll("queries/");
    if (existing.length >= 2000) return { error: "The query box is full. Please email the conference address.", status: 429 };
    await put(`queries/${record.id}.json`, JSON.stringify(record), {
      access: "private",
      contentType: "application/json",
      allowOverwrite: false,
    });
    return { ok: true };
  }
  const count = await countOf("queries");
  if (count >= 2000 || (await countRecent("queries")) >= hourlyCap) {
    return { error: "The query box is full. Please email the conference address.", status: 429 };
  }
  await sql(
    "insert into queries (id, created_at, full_name, email, topic, message) values ($1, $2, $3, $4, $5, $6)",
    [record.id, record.createdAt, record.fullName, record.email, record.topic, record.message],
  );
  return { ok: true };
}

export async function listQueries(): Promise<QueryRecord[]> {
  if (storageMode() === "blob") return listJson("queries/", parseQuery);
  const rows = await sql<Record<string, unknown>>(
    "select id, created_at, full_name, email, topic, message from queries order by created_at desc",
  );
  return rows.map((row) => ({
    id: String(row.id),
    createdAt: iso(row.created_at),
    fullName: String(row.full_name),
    email: String(row.email),
    topic: String(row.topic),
    message: String(row.message),
  }));
}

export async function getMeetingUrl(): Promise<string | null> {
  if (storageMode() === "blob") {
    const text = await readText("settings/meeting-url.txt");
    return text && text.startsWith("https://") ? text : null;
  }
  const rows = await sql<{ value: string }>("select value from settings where key = 'meeting_url'");
  const value = rows[0]?.value ?? "";
  return value.startsWith("https://") ? value : null;
}

export async function setMeetingUrl(url: string): Promise<void> {
  if (storageMode() === "blob") {
    await put("settings/meeting-url.txt", url, {
      access: "private",
      contentType: "text/plain",
      allowOverwrite: true,
    });
    return;
  }
  await sql(
    "insert into settings (key, value) values ('meeting_url', $1) on conflict (key) do update set value = excluded.value",
    [url],
  );
}

function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let reference = "YDU-";
  for (const byte of bytes) reference += alphabet[byte % alphabet.length]!;
  return reference;
}

function registrationFromRow(row: Record<string, unknown>): Registration {
  return {
    id: String(row.id),
    reference: String(row.reference),
    createdAt: iso(row.created_at),
    title: String(row.title ?? "") as Title | "",
    creClaim: String(row.cre_claim ?? "") as CreClaim | "",
    fullName: String(row.full_name),
    email: String(row.email),
    mobile: String(row.mobile),
    crrNumber: String(row.crr_number),
    profession: String(row.profession) as Profession,
    professionDetail: String(row.profession_detail ?? ""),
    designation: String(row.designation ?? ""),
    institution: String(row.institution),
    stateName: String(row.state_name),
    paymentReference: String(row.payment_reference ?? ""),
    paymentProof: String(row.payment_proof ?? ""),
    documents: splitKinds(String(row.documents ?? "")),
    verification: parseVerification(String(row.verification ?? "")),
    deskReview: parseDeskReview(String(row.desk_review ?? "")),
    accessNeeds: String(row.access_needs ?? ""),
    source: String(row.source) as ArrivalSource,
    consent: row.consent === true || row.consent === "t" || row.consent === "true",
  };
}

function parseVerification(text: string): Verification | null {
  if (text === "") return null;
  try {
    const value = JSON.parse(text) as Verification;
    return value && typeof value.status === "string" ? value : null;
  } catch {
    return null;
  }
}

function parseDeskReview(text: string): DeskReview | null {
  if (text === "") return null;
  try {
    const value = JSON.parse(text) as DeskReview;
    return typeof value === "object" && value !== null ? value : null;
  } catch {
    return null;
  }
}

function parseRegistration(value: unknown): Registration | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Registration;
  if (typeof row.reference !== "string" || typeof row.email !== "string") return null;
  if (typeof row.paymentProof !== "string") row.paymentProof = "";
  if (typeof row.professionDetail !== "string") row.professionDetail = "";
  if (typeof row.title !== "string") row.title = "";
  if (typeof row.creClaim !== "string") row.creClaim = "";
  row.documents = Array.isArray(row.documents) ? row.documents.filter((kind) => isDocKind(String(kind))) : [];
  if (typeof row.verification !== "object") row.verification = null;
  if (typeof row.deskReview !== "object") row.deskReview = null;
  return row;
}

function parseQuery(value: unknown): QueryRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as QueryRecord;
  if (typeof row.id !== "string" || typeof row.email !== "string") return null;
  return row;
}

function withinHourlyPace(kind: "registrations" | "queries"): boolean {
  const now = Date.now();
  const recent = pace[kind].filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= hourlyCap) {
    pace[kind] = recent;
    return false;
  }
  recent.push(now);
  pace[kind] = recent;
  return true;
}

async function countRecent(table: "registrations" | "queries"): Promise<number> {
  const rows = await sql<{ count: unknown }>(
    `select count(*) as count from ${table} where created_at > now() - interval '1 hour'`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function countOf(table: "registrations" | "queries"): Promise<number> {
  const column = table === "registrations" ? "registrations" : "queries";
  const rows = await sql<{ count: unknown }>(`select count(*) as count from ${column}`);
  return Number(rows[0]?.count ?? 0);
}

async function listJson<T>(prefix: string, parse: (value: unknown) => T | null): Promise<T[]> {
  const blobs = await listAll(prefix);
  const records: T[] = [];
  for (let index = 0; index < blobs.length; index += 8) {
    const chunk = blobs.slice(index, index + 8);
    const parsed = await Promise.all(chunk.map(async (blob) => readJson(blob.pathname, parse)));
    for (const item of parsed) if (item) records.push(item);
  }
  return records.sort((left, right) => {
    const a = "createdAt" in (left as object) ? String((left as { createdAt: string }).createdAt) : "";
    const b = "createdAt" in (right as object) ? String((right as { createdAt: string }).createdAt) : "";
    return b.localeCompare(a);
  });
}

async function listAll(prefix: string) {
  const blobs = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function readJson<T>(pathname: string, parse: (value: unknown) => T | null): Promise<T | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  return parse(JSON.parse(text) as unknown);
}

async function readText(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = (await new Response(result.stream).text()).trim();
  return text === "" ? null : text;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}
