import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "cre_desk";
const twelveHours = 60 * 60 * 12;

export function allowedAdminEmails(): string[] {
  const extra = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.includes("@"));
  return [...new Set(["yenepoyaaslpconference@gmail.com", ...extra])];
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
