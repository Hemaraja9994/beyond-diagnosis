import { createHash, randomBytes, randomUUID } from "node:crypto";
import { get, list, put } from "@vercel/blob";
import { sql, storageMode } from "@/lib/db";
import type { ArrivalSource, Profession } from "@/lib/programme";
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
  designation: string;
  institution: string;
  stateName: string;
  paymentReference: string;
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
const duplicateMessage =
  "This email is already registered. Add a payment reference from the confirmation, or write to the conference email.";
const capacityMessage = "Registration is full. Write to the conference email and the organising team will help.";

export async function createRegistration(draft: RegistrationDraft): Promise<{ reference: string } | StoreError> {
  if (storageMode() === "blob") return createRegistrationBlob(draft);
  return createRegistrationSql(draft);
}

export async function listRegistrations(): Promise<Registration[]> {
  if (storageMode() === "blob") return listJson("registrations/", parseRegistration);
  const rows = await sql<Record<string, unknown>>(
    "select id, reference, created_at, full_name, email, mobile, crr_number, profession, designation, institution, state_name, payment_reference, access_needs, source, consent from registrations order by created_at desc",
  );
  return rows.map(registrationFromRow);
}

export async function addPaymentReference(
  reference: string,
  email: string,
  paymentReference: string,
): Promise<{ ok: true } | StoreError> {
  if (storageMode() === "blob") return addPaymentBlob(reference, email, paymentReference);
  const rows = await sql<{ id: string }>(
    "update registrations set payment_reference = $1 where reference = $2 and lower(email) = lower($3) returning id",
    [paymentReference, reference, email],
  );
  if (rows.length === 0) return { error: "No registration matched that reference and email.", status: 404 };
  return { ok: true };
}

export async function createQuery(draft: QueryDraft): Promise<{ ok: true } | StoreError> {
  const record: QueryRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...draft,
  };
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
  if (count >= 2000) return { error: "The query box is full. Please email the conference address.", status: 429 };
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

async function createRegistrationSql(draft: RegistrationDraft): Promise<{ reference: string } | StoreError> {
  if ((await countOf("registrations")) >= 2000) return { error: capacityMessage, status: 429 };
  const reference = makeReference();
  const record = toRegistration(draft, reference);
  try {
    await sql(
      `insert into registrations (
        id, reference, created_at, full_name, email, mobile, crr_number, profession, designation,
        institution, state_name, payment_reference, access_needs, source, consent
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        record.id,
        record.reference,
        record.createdAt,
        record.fullName,
        record.email,
        record.mobile,
        record.crrNumber,
        record.profession,
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
    if (isUniqueViolation(error)) return { error: duplicateMessage, status: 409 };
    throw error;
  }
  return { reference };
}

async function createRegistrationBlob(draft: RegistrationDraft): Promise<{ reference: string } | StoreError> {
  const existing = await listAll("registrations/");
  if (existing.length >= 2000) return { error: capacityMessage, status: 429 };
  const emailPath = `email-index/${createHash("sha256").update(draft.email).digest("hex")}.txt`;
  const prior = await get(emailPath, { access: "private", useCache: false });
  if (prior?.statusCode === 200) return { error: duplicateMessage, status: 409 };
  const record = toRegistration(draft, makeReference());
  await put(`registrations/${record.reference}.json`, JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: false,
  });
  await put(emailPath, record.reference, { access: "private", contentType: "text/plain", allowOverwrite: false });
  return { reference: record.reference };
}

async function addPaymentBlob(reference: string, email: string, paymentReference: string): Promise<{ ok: true } | StoreError> {
  const record = await readJson(`registrations/${reference}.json`, parseRegistration);
  if (!record || record.email !== email) return { error: "No registration matched that reference and email.", status: 404 };
  record.paymentReference = paymentReference;
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
    ...draft,
  };
}

function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
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
    designation: String(row.designation ?? ""),
    institution: String(row.institution),
    stateName: String(row.state_name),
    paymentReference: String(row.payment_reference ?? ""),
    accessNeeds: String(row.access_needs ?? ""),
    source: String(row.source) as ArrivalSource,
    consent: row.consent === true || row.consent === "t" || row.consent === "true",
  };
}

function parseRegistration(value: unknown): Registration | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Registration;
  if (typeof row.reference !== "string" || typeof row.email !== "string") return null;
  return row;
}

function parseQuery(value: unknown): QueryRecord | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as QueryRecord;
  if (typeof row.id !== "string" || typeof row.email !== "string") return null;
  return row;
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
