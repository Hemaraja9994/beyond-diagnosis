import { certificateCode, participantToken } from "@/lib/admin";
import { afterSessionsOpen, isOnlineTrack, onlineProgramme, programme } from "@/lib/programme";
import { paymentState } from "@/lib/status";
import { getRegistration, getSetting, saveDeskReview, setSetting, type Registration } from "@/lib/store";

/**
 * E-certificates of participation.
 *  – Who: every registration whose payment is confirmed (by the automatic check or a coordinator).
 *  – When: from the programme day, once a coordinator releases them on the desk.
 *  – Number: fixed the first time a certificate is issued (YMC/ASLP/CRE/2026/0001, …) and never reused. The
 *    regular online programme (non-RCI) has its own series (YMC/ASLP/ONL/2026/0001, …).
 *  – Coordinators can save (number) certificates on the desk before the programme day, to add e-signatures;
 *    participants can download only after release.
 */
export type IssuedCertificate = { number: number; issuedAt: string };

export const certificatePrefix = "YMC/ASLP/CRE/2026/";

export function certificateNumberText(number: number, online = false): string {
  return `${online ? onlineProgramme.certificatePrefix : certificatePrefix}${String(Math.max(number, 0)).padStart(4, "0")}`;
}

/**
 * The date printed on the certificate. Certificates saved on the desk before the programme (to add e-signatures)
 * still show the programme day, never a date before it.
 */
export function certificateIssueDate(issued: IssuedCertificate): string {
  const day = Date.parse(programme.sessionsOpenAt);
  const at = Date.parse(issued.issuedAt);
  return Number.isFinite(at) && at >= day ? issued.issuedAt : `${programme.sessionsOpenAt.slice(0, 10)}T12:00:00+05:30`;
}

/** The certificate number as printed for this registration (online-programme rows use the ONL series). */
export function rowCertificateNumber(row: Registration, issued: IssuedCertificate): string {
  return certificateNumberText(issued.number, isOnlineTrack(row));
}

export function certificateEligible(row: Registration): boolean {
  return paymentState(row) === "confirmed";
}

/** Coordinators release certificates on the desk; the switch only takes effect from the programme day. */
export async function certificatesReleased(): Promise<boolean> {
  if (!afterSessionsOpen()) return false;
  return (await getSetting("certificates_released").catch(() => null)) === "yes";
}

export async function certificatesSwitchOn(): Promise<boolean> {
  return (await getSetting("certificates_released").catch(() => null)) === "yes";
}

export async function setCertificatesReleased(on: boolean): Promise<void> {
  await setSetting("certificates_released", on ? "yes" : "no");
}

/** Can this participant download their certificate now? */
export async function certificateAvailable(row: Registration): Promise<boolean> {
  return certificateEligible(row) && (await certificatesReleased());
}

/** Returns the certificate's number, giving the registration the next free number the first time. */
export async function ensureCertificate(row: Registration): Promise<IssuedCertificate> {
  const existing = row.deskReview?.certificate;
  if (existing && Number.isInteger(existing.number) && existing.number > 0) return existing;
  const sequence = isOnlineTrack(row) ? "certificate_seq_online" : "certificate_seq";
  const saved = Number(await getSetting(sequence).catch(() => null));
  const next = (Number.isInteger(saved) && saved > 0 ? saved : 0) + 1;
  await setSetting(sequence, String(next));
  const issued: IssuedCertificate = { number: next, issuedAt: new Date().toISOString() };
  const fresh = (await getRegistration(row.reference)) ?? row;
  if (fresh.deskReview?.certificate) return fresh.deskReview.certificate;
  await saveDeskReview(row.reference, { ...(fresh.deskReview ?? {}), certificate: issued });
  row.deskReview = { ...(fresh.deskReview ?? {}), certificate: issued };
  return issued;
}

/** Numbers everyone eligible in order of registration, so the numbers follow the register. */
export async function numberAllEligible(rows: Registration[]): Promise<number> {
  const waiting = rows
    .filter((row) => certificateEligible(row) && !row.deskReview?.certificate)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const row of waiting) await ensureCertificate(row);
  return waiting.length;
}

export function certificateVerifyUrl(origin: string, reference: string): string {
  const code = certificateCode(reference) ?? "";
  return `${origin}/verify/${reference}?c=${encodeURIComponent(code)}`;
}

export function certificatePdfUrl(reference: string): string | null {
  const token = participantToken(reference);
  return token ? `/api/certificate/${reference}?t=${encodeURIComponent(token)}` : null;
}

/** LinkedIn's "Add licence or certification" form, filled in. */
export function linkedInAddUrl(row: Registration, issued: IssuedCertificate, verifyUrl: string): string {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: `${programme.title}: ${programme.subtitle} (${isOnlineTrack(row) ? onlineProgramme.name : "Zonal CRE"})`,
    organizationName: `${programme.university}`,
    issueYear: "2026",
    issueMonth: "12",
    certUrl: verifyUrl,
    certId: rowCertificateNumber(row, issued),
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

export function participantName(row: Registration): string {
  return `${row.title ? `${row.title} ` : ""}${row.fullName}`.trim();
}

export function certificateFileName(row: Registration, issued: IssuedCertificate): string {
  const name = row.fullName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return `Certificate-${isOnlineTrack(row) ? "ONL-" : ""}${String(issued.number).padStart(4, "0")}-${name || row.reference}.pdf`;
}
