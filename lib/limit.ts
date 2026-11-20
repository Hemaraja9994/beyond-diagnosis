import { json } from "@/lib/http";

type Bucket = { count: number; started: number };

const buckets = new Map<string, Bucket>();

function platformIp(request: Request): string | null {
  const real = request.headers.get("x-real-ip")?.trim() ?? "";
  if (isIp(real)) return real;
  const vercel = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (isIp(vercel)) return vercel;
  return null;
}

function isIp(value: string): boolean {
  return value.length > 0 && value.length <= 64 && /^[0-9a-fA-F:.]+$/.test(value);
}

export function clientKey(request: Request): string {
  return platformIp(request) ?? "shared";
}

export function tooMany(request: Request, scope: string, limit: number, windowMs: number): Response | null {
  const now = Date.now();
  const client = `${scope}:${clientKey(request)}`;
  const global = `${scope}:all`;
  if (spent(client, now, limit, windowMs) || spent(global, now, limit * 4, windowMs)) {
    return json({ error: "Too many submissions. Wait a few minutes and try again." }, 429);
  }
  return null;
}

export function clearClientLimit(request: Request, scope: string): void {
  buckets.delete(`${scope}:${clientKey(request)}`);
}

function spent(key: string, now: number, limit: number, windowMs: number): boolean {
  const prior = buckets.get(key);
  if (!prior || now - prior.started >= windowMs) {
    buckets.set(key, { count: 1, started: now });
    return false;
  }
  if (prior.count >= limit) return true;
  prior.count += 1;
  return false;
}
