import { createHash, randomBytes, randomUUID } from "node:crypto";
import { get, list, put } from "@vercel/blob";
import { sql, storageMode } from "@/lib/db";
import type { ArrivalSource, Profession } from "@/lib/programme";
import type { ProofFile } from "@/lib/proof";
import type { QueryDraft, RegistrationDraft } from "@/lib/validate";

export { storageMode };

export type Registration = {
  id: string;
  reference: string;
  createdAt: string;
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
  paymentProof: string;
  accessNeeds: string;
  source: ArrivalSource;
  consent: boolean;
};

export type QueryRecord = {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  topic: string;
  message: string;
};

type StoreError = { error: string; status: number };
const duplicateMessage = "Registration could not be completed with these details.";
const capacityMessage = "Registration is full. Write to the conference email and the organising team will help.";
const pauseMessage = "Registration is paused for a short while. Try again later or write to the conference email.";
const paymentMessage = "That payment could not be saved. Use the email from the registration.";
const paymentLocked = "A payment id is already saved for this registration.";
let columnsReady = false;
const hourlyCap = 40;
const pace: Record<"registrations" | "queries", number[]> = { registrations: [], queries: [] };

export async function createRegistration(draft: RegistrationDraft): Promise<{ reference: string } | StoreError> {
  if (storageMode() === "blob") return createRegistrationBlob(draft);
  return createRegistrationSql(draft);
}

export async function listRegistrations(): Promise<Registration[]> {
  if (storageMode() === "blob") return listJson("registrations/", parseRegistration);
  await ensurePaymentColumns();
  const rows = await sql<Record<string, unknown>>(
    "select id, reference, created_at, full_name, email, mobile, crr_number, profession, profession_detail, designation, institution, state_name, payment_reference, payment_proof, access_needs, source, consent from registrations order by created_at desc",
  );
  return rows.map(registrationFromRow);
}

export async function addPayment(
  reference: string,
  email: string,
  paymentReference: string,
  proof: ProofFile | null,
): Promise<{ ok: true } | StoreError> {
  if (storageMode() === "blob") return addPaymentBlob(reference, email, paymentReference, proof);
  await ensurePaymentColumns();
  const found = await sql<{ email: string; payment_reference: string }>(
    "select email, payment_reference from registrations where reference = $1",
    [reference],
  );
  const current = found[0];
  if (!current || current.email.toLowerCase() !== email) return { error: paymentMessage, status: 400 };
  if (paymentReference !== "" && current.payment_reference !== "" && current.payment_reference !== paymentReference) {
    return { error: paymentLocked, status: 400 };
  }
  const rows = await sql<{ id: string }>(
    `update registrations set
       payment_reference = case when $1 = '' then payment_reference else $1 end,
       payment_proof = case when $2 = '' then payment_proof else $2 end,
       payment_proof_data = case when $3 = '' then payment_proof_data else $3 end
     where reference = $4 and lower(email) = lower($5)
     returning id`,
    [paymentReference, proof?.contentType ?? "", proof ? proof.bytes.toString("base64") : "", reference, email],
  );
  if (rows.length === 0) return { error: paymentMessage, status: 400 };
  return { ok: true };
}

export async function getPaymentProof(reference: string): Promise<ProofFile | null> {
  if (storageMode() === "blob") {
    const record = await readJson(`registrations/${reference}.json`, parseRegistration);
    if (!record || record.paymentProof === "") return null;
    const result = await get(`payments/${reference}`, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    if (record.paymentProof !== "image/jpeg" && record.paymentProof !== "image/png" && record.paymentProof !== "image/webp") {
      return null;
    }
    return { contentType: record.paymentProof, bytes };
  }
  await ensurePaymentColumns();
  const rows = await sql<{ payment_proof: string; payment_proof_data: string }>(
    "select payment_proof, payment_proof_data from registrations where reference = $1",
    [reference],
  );
  const row = rows[0];
  if (!row || row.payment_proof === "" || row.payment_proof_data === "") return null;
  if (row.payment_proof !== "image/jpeg" && row.payment_proof !== "image/png" && row.payment_proof !== "image/webp") return null;
  return { contentType: row.payment_proof, bytes: Buffer.from(row.payment_proof_data, "base64") };
}

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

async function ensurePaymentColumns(): Promise<void> {
  if (columnsReady || storageMode() === "blob") return;
  await sql("alter table registrations add column if not exists payment_proof text not null default ''");
  await sql("alter table registrations add column if not exists payment_proof_data text not null default ''");
  await sql("alter table registrations add column if not exists profession_detail text not null default ''");
  columnsReady = true;
}

async function createRegistrationSql(draft: RegistrationDraft): Promise<{ reference: string } | StoreError> {
  await ensurePaymentColumns();
  if (!withinHourlyPace("registrations")) return { error: pauseMessage, status: 429 };
  if ((await countOf("registrations")) >= 2000) return { error: capacityMessage, status: 429 };
  if ((await countRecent("registrations")) >= hourlyCap) return { error: pauseMessage, status: 429 };
  const reference = makeReference();
  const record = toRegistration(draft, reference);
  try {
    await sql(
      `insert into registrations (
        id, reference, created_at, full_name, email, mobile, crr_number, profession, profession_detail, designation,
        institution, state_name, payment_reference, access_needs, source, consent
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        record.id,
        record.reference,
        record.createdAt,
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
  const emailPath = `email-index/${createHash("sha256").update(draft.email).digest("hex")}.txt`;
  const prior = await get(emailPath, { access: "private", useCache: false });
  if (prior?.statusCode === 200) return { error: duplicateMessage, status: 400 };
  const record = toRegistration(draft, makeReference());
  await put(`registrations/${record.reference}.json`, JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: false,
  });
  await put(emailPath, record.reference, { access: "private", contentType: "text/plain", allowOverwrite: false });
  return { reference: record.reference };
}

async function addPaymentBlob(
  reference: string,
  email: string,
  paymentReference: string,
  proof: ProofFile | null,
): Promise<{ ok: true } | StoreError> {
  const record = await readJson(`registrations/${reference}.json`, parseRegistration);
  if (!record || record.email !== email) return { error: paymentMessage, status: 400 };
  if (paymentReference !== "" && record.paymentReference !== "" && record.paymentReference !== paymentReference) {
    return { error: paymentLocked, status: 400 };
  }
  if (paymentReference !== "") record.paymentReference = paymentReference;
  if (proof) {
    await put(`payments/${reference}`, proof.bytes, {
      access: "private",
      contentType: proof.contentType,
      allowOverwrite: true,
    });
    record.paymentProof = proof.contentType;
  }
  await put(`registrations/${reference}.json`, JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
  return { ok: true };
}

function toRegistration(draft: RegistrationDraft, reference: string): Registration {
  return {
    id: randomUUID(),
    reference,
    createdAt: new Date().toISOString(),
    paymentProof: "",
    ...draft,
  };
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
    accessNeeds: String(row.access_needs ?? ""),
    source: String(row.source) as ArrivalSource,
    consent: row.consent === true || row.consent === "t" || row.consent === "true",
  };
}

function parseRegistration(value: unknown): Registration | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Registration;
  if (typeof row.reference !== "string" || typeof row.email !== "string") return null;
  if (typeof row.paymentProof !== "string") row.paymentProof = "";
  if (typeof row.professionDetail !== "string") row.professionDetail = "";
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
