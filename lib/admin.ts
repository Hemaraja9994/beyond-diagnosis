import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { deskAccountName } from "@/lib/programme";
import { startingPasswordHashes } from "@/lib/desk-defaults";
import { getDeskPasswordHash } from "@/lib/store";

const cookieName = "cre_desk";
const twelveHours = 60 * 60 * 12;

/** Conference mailbox shared by the desk coordinators, including Ms. Pavana M J. */
const conferenceEmail = "yenepoyaaslpconference@gmail.com";

export function allowedAdminEmails(): string[] {
  const extra = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes("@"));
  return [...new Set([conferenceEmail, ...extra])];
}

export function adminReady(): boolean {
  return accessCode() !== null && sessionSecret() !== null;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function credentialsMatch(email: string, code: string): boolean {
  const expectedCode = accessCode();
  const secret = sessionSecret();
  if (!expectedCode || !secret) return false;
  const allowed = allowedAdminEmails().includes(email.trim().toLowerCase());
  const codeOk = fixedEqual(code, expectedCode, secret);
  return allowed && codeOk;
}

/**
 * Who is signed in. Either the shared conference mailbox (signed in with the access code — the "owner",
 * who can set coordinator passwords) or one coordinator ("user:rachana").
 */
export type DeskUser = { id: string; name: string; owner: boolean };

export function deskUser(id: string | null): DeskUser | null {
  if (!id) return null;
  if (id.startsWith("user:")) {
    const name = deskAccountName(id.slice(5));
    return name ? { id, name, owner: false } : null;
  }
  return { id, name: id, owner: true };
}

/** Coordinator sign-in with a username and the password set from the desk. */
export async function coordinatorMatch(username: string, password: string): Promise<boolean> {
  const user = username.trim().toLowerCase();
  if (!deskAccountName(user) || password.length === 0) return false;
  const stored = (await getDeskPasswordHash(user)) ?? startingPasswordHashes[user] ?? null;
  return stored ? passwordMatches(password, stored) : false;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

function passwordMatches(password: string, stored: string): boolean {
  const [scheme, salt, key] = stored.split("$");
  if ((scheme !== "scrypt" && scheme !== "scrypt17") || !salt || !key) return false;
  const expected = Buffer.from(key, "base64url");
  // "scrypt17" is the slower setting used for the starting passwords kept in the public code.
  const cost = scheme === "scrypt17" ? { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } : {};
  const actual = scryptSync(password, Buffer.from(salt, "base64url"), expected.length, cost);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function sessionCookie(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email: email.trim().toLowerCase(), exp: Date.now() + twelveHours * 1000 }),
    "utf8",
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${cookieName}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${twelveHours}${secure}`;
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export async function currentAdmin(): Promise<string | null> {
  const jar = await cookies();
  return readToken(jar.get(cookieName)?.value);
}

export function adminFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  const piece = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  return readToken(piece?.slice(cookieName.length + 1));
}

function readToken(token: string | undefined): string | null {
  if (!token || !sessionSecret()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !fixedEqual(signature, sign(payload), sessionSecret()!)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: unknown; exp?: unknown };
    if (typeof parsed.email !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    if (parsed.email.startsWith("user:")) return deskAccountName(parsed.email.slice(5)) ? parsed.email : null;
    if (!allowedAdminEmails().includes(parsed.email)) return null;
    return parsed.email;
  } catch {
    return null;
  }
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()!).update(payload).digest("base64url");
}

function fixedEqual(left: string, right: string, secret: string): boolean {
  const a = createHmac("sha256", secret).update(left).digest();
  const b = createHmac("sha256", secret).update(right).digest();
  return timingSafeEqual(a, b);
}

function accessCode(): string | null {
  const value = process.env.ADMIN_ACCESS_CODE?.trim() ?? "";
  return value.length >= 8 ? value : null;
}

function sessionSecret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  return value.length >= 16 ? value : null;
}

/** Short code that lets a participant open their own status page and PDF without typing their email again. */
export function participantToken(reference: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`ack:${reference}`).digest("base64url").slice(0, 22);
}

export function participantTokenOk(reference: string, token: string): boolean {
  const expected = participantToken(reference);
  if (!expected || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
