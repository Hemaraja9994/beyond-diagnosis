import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import QRCode from "qrcode";
import { committee, professionLabel, programme, rciApprovalLine, type Profession } from "@/lib/programme";
import { overallState, paymentState, paymentText, rciState, rciText } from "@/lib/status";
import type { Registration } from "@/lib/store";

/**
 * A4 registration acknowledgement: college logo, department, programme, participant details, status,
 * an electronic stamp and a QR code that opens the live status page.
 * This is an electronically generated document, not a DSC (digital signature certificate) signature.
 */
const A4: [number, number] = [595.28, 841.89];
const navy = rgb(0.06, 0.13, 0.29);
const muted = rgb(0.36, 0.4, 0.47);
const line = rgb(0.85, 0.87, 0.9);
const orange = rgb(0.89, 0.34, 0.04);
const green = rgb(0.06, 0.5, 0.28);
const red = rgb(0.72, 0.11, 0.11);

export async function acknowledgementPdf(row: Registration, statusUrl: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Registration acknowledgement ${row.reference}`);
  pdf.setAuthor(`${programme.organiser}, ${programme.university}`);
  pdf.setSubject(`${programme.title} — ${programme.acknowledgement}`);
  pdf.setCreator("Beyond the Diagnosis registration desk");
  const page = pdf.addPage(A4);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [width, height] = A4;
  const left = 48;
  const right = width - 48;

  // Header: logo and department
  const logoBytes = await readFile(path.join(process.cwd(), "public", "brand", "yenepoya-medical-college.png"));
  const logo = await pdf.embedPng(logoBytes);
  const logoW = 132;
  const logoH = (logo.height / logo.width) * logoW;
  page.drawImage(logo, { x: left, y: height - 40 - logoH, width: logoW, height: logoH });
  let y = height - 52;
  const headX = left + logoW + 18;
  y = text(page, programme.organiser, headX, y, bold, 12.5, navy, right - headX);
  y = text(page, `${programme.hospital}, ${programme.university}`, headX, y - 2, regular, 9.5, muted, right - headX);
  y = text(page, programme.address, headX, y - 1, regular, 8.5, muted, right - headX);
  y = Math.min(y, height - 40 - logoH) - 12;
  page.drawRectangle({ x: left, y, width: right - left, height: 2.5, color: orange });
  y -= 26;

  centred(page, "REGISTRATION ACKNOWLEDGEMENT", y, bold, 15, navy);
  y -= 24;

  // Programme
  y = text(page, `${programme.title}: ${programme.subtitle}`, left, y, bold, 11, navy, right - left);
  y = text(
    page,
    `${programme.level} Continuing Rehabilitation Education · ${programme.mode} (Cisco Webex) · ${programme.dateLabel}, from ${programme.start}`,
    left,
    y - 2,
    regular,
    9.5,
    muted,
    right - left,
  );
  y = text(
    page,
    `RCI acknowledgement ${programme.acknowledgement} · Institute code ${programme.instituteCode} · ${rciApprovalLine}`,
    left,
    y - 1,
    regular,
    9.5,
    muted,
    right - left,
  );
  y -= 16;

  // Participant
  y = heading(page, "Participant", left, y, bold);
  const name = `${row.title ? `${row.title} ` : ""}${row.fullName}`;
  const details: [string, string][] = [
    ["Reference", row.reference],
    ["Name", name],
    ["Category", `${professionLabel(row.profession as Profession)}${row.professionDetail ? ` (${row.professionDetail})` : ""}`],
    ["CRR number", row.crrNumber || "—"],
    ["Email", row.email],
    ["Mobile", row.mobile],
    ["Workplace", [row.designation, row.institution].filter(Boolean).join(", ")],
    ["State", row.stateName],
    ["Registered on", ist(row.createdAt)],
    ["Payment ID", row.paymentReference || "—"],
  ];
  y = table(page, details, left, y, right, regular, bold);
  y -= 14;

  // Status
  y = heading(page, "Status", left, y, bold);
  const pay = paymentState(row);
  const rci = rciState(row);
  const statusTop = y;
  const statusRight = right - 150;
  const payBy = row.deskReview?.payment ? ` (checked by ${row.deskReview.payment.by})` : "";
  const rciBy = row.deskReview?.rci ? ` (checked by ${row.deskReview.rci.by})` : "";
  const statuses: [string, string, RGB][] = [
    ["Registration", "Registered", green],
    [`Payment (Rs. ${programme.feeRupees})`, paymentText[pay] + payBy, pay === "confirmed" ? green : pay === "rejected" ? red : orange],
    [
      "RCI CRE points",
      rciText[rci] + rciBy,
      rci === "confirmed" ? green : rci === "rejected" ? red : rci === "awaited" || rci === "submitted" ? orange : muted,
    ],
  ];
  for (const [label, value, colour] of statuses) {
    page.drawCircle({ x: left + 4, y: y + 3.5, size: 3.5, color: colour });
    page.drawText(safe(label), { x: left + 14, y, size: 9.5, font: bold, color: navy });
    y = text(page, value, left + 150, y, regular, 9.5, colour, statusRight - (left + 150)) - 6;
  }

  const attendance = row.deskReview?.attendance?.decision;
  if (attendance) {
    page.drawCircle({ x: left + 4, y: y + 3.5, size: 3.5, color: attendance === "attended" ? green : red });
    page.drawText("Webex attendance", { x: left + 14, y, size: 9.5, font: bold, color: navy });
    y = text(page, attendance === "attended" ? "Attended" : "Not recorded", left + 150, y, regular, 9.5, attendance === "attended" ? green : red, statusRight - (left + 150)) - 6;
  }
  const exam = row.deskReview?.exam?.decision;
  if (row.creClaim === "yes" && exam) {
    page.drawCircle({ x: left + 4, y: y + 3.5, size: 3.5, color: exam === "passed" ? green : red });
    page.drawText("RCI online exam", { x: left + 14, y, size: 9.5, font: bold, color: navy });
    y = text(page, exam === "passed" ? "Completed" : exam === "not-passed" ? "Not cleared (as reported by RCI)" : "Not taken", left + 150, y, regular, 9.5, exam === "passed" ? green : red, statusRight - (left + 150)) - 6;
  }
  if (row.creClaim === "yes") {
    y = text(
      page,
      "Sessions run live on Cisco Webex with Slido for questions and polls. The online examination is conducted by RCI after the sessions, and CRE points are credited by RCI to the participant's profile on the RCI website.",
      left + 14,
      y - 2,
      regular,
      8,
      muted,
      statusRight - left - 14,
    ) - 4;
  } else {
    y = text(page, "Sessions run live on Cisco Webex, with Slido for questions and polls.", left + 14, y - 2, regular, 8, muted, statusRight - left - 14) - 4;
  }

  // Stamp
  const overall = overallState(row);
  const stampColour = overall.tone === "ok" ? green : overall.tone === "stop" ? red : orange;
  stamp(page, right - 62, statusTop - 40, overall.word, stampColour, regular, bold);
  y = Math.min(y, statusTop - 110) - 10;

  // Organising team
  y = heading(page, "Organising team", left, y, bold);
  const columnWidth = (right - left) / committee.length;
  let lowest = y;
  committee.forEach((seat, index) => {
    const x = left + index * columnWidth;
    let cy = y;
    cy = text(page, seat.role, x, cy, regular, 8.5, muted, columnWidth - 10);
    for (const person of seat.names) cy = text(page, person, x, cy - 1, bold, 10, navy, columnWidth - 10);
    lowest = Math.min(lowest, cy);
  });
  y = lowest - 14;

  // Verification: QR and note
  const qr = await pdf.embedPng(await QRCode.toBuffer(statusUrl, { type: "png", margin: 1, width: 240, errorCorrectionLevel: "M" }));
  const qrSize = 92;
  const qrY = Math.max(58, y - qrSize);
  page.drawImage(qr, { x: left, y: qrY, width: qrSize, height: qrSize });
  let vy = qrY + qrSize - 10;
  vy = text(page, "Electronically generated acknowledgement", left + qrSize + 14, vy, bold, 10, navy, right - left - qrSize - 14);
  vy = text(
    page,
    "Issued by the CRE registration desk. No physical signature is required. This is not a DSC digital signature: scan the QR code or open the link below to see the current status, which updates when payment or RCI confirmation is checked.",
    left + qrSize + 14,
    vy - 2,
    regular,
    8.5,
    muted,
    right - left - qrSize - 14,
  );
  vy = text(page, statusUrl, left + qrSize + 14, vy - 2, regular, 7.5, navy, right - left - qrSize - 14);
  text(page, `Issued ${ist(new Date().toISOString())}`, left + qrSize + 14, vy - 2, regular, 8, muted, right - left - qrSize - 14);

  // Footer
  page.drawRectangle({ x: left, y: 46, width: right - left, height: 0.8, color: line });
  centred(page, `${programme.email} · ${programme.departmentEmail} · ${programme.departmentPhone}`, 32, regular, 8, muted);

  return pdf.save();
}

function stamp(page: PDFPage, cx: number, cy: number, word: string, colour: RGB, regular: PDFFont, bold: PDFFont) {
  page.drawCircle({ x: cx, y: cy, size: 56, borderColor: colour, borderWidth: 2.2, opacity: 0, borderOpacity: 0.9 });
  page.drawCircle({ x: cx, y: cy, size: 50, borderColor: colour, borderWidth: 0.8, opacity: 0, borderOpacity: 0.9 });
  const lines: [string, PDFFont, number][] = [
    ["YENEPOYA · ASLP", bold, 7],
    ["CRE 2026", regular, 7],
    [word, bold, word.length > 10 ? 8.5 : 12],
    [new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }).toUpperCase(), regular, 7],
  ];
  let y = cy + 20;
  for (const [value, font, size] of lines) {
    const w = font.widthOfTextAtSize(value, size);
    page.drawText(value, { x: cx - w / 2, y, size, font, color: colour });
    y -= size + (size > 9 ? 9 : 7);
  }
}

function heading(page: PDFPage, value: string, x: number, y: number, bold: PDFFont): number {
  page.drawText(value.toUpperCase(), { x, y, size: 9, font: bold, color: orange });
  page.drawRectangle({ x, y: y - 5, width: A4[0] - 96, height: 0.6, color: line });
  return y - 20;
}

function table(page: PDFPage, rows: [string, string][], left: number, y: number, right: number, regular: PDFFont, bold: PDFFont): number {
  for (const [label, value] of rows) {
    page.drawText(safe(label), { x: left, y, size: 9.5, font: bold, color: muted });
    y = text(page, value || "—", left + 110, y, regular, 10, navy, right - left - 110) - 4;
  }
  return y;
}

/** Writes wrapped text; returns the baseline for the next line. */
function text(page: PDFPage, value: string, x: number, y: number, font: PDFFont, size: number, colour: RGB, maxWidth: number): number {
  const words = safe(value).split(/\s+/);
  let current = "";
  const lines: string[] = [];
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth || current === "") current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  for (const piece of lines) {
    page.drawText(piece, { x, y, size, font, color: colour });
    y -= size + 3.5;
  }
  return y;
}

function centred(page: PDFPage, value: string, y: number, font: PDFFont, size: number, colour: RGB) {
  const clean = safe(value);
  page.drawText(clean, { x: (A4[0] - font.widthOfTextAtSize(clean, size)) / 2, y, size, font, color: colour });
}

/** The built-in PDF fonts cover Western characters only; accents are folded and anything else becomes "?". */
function safe(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/₹/g, "Rs. ")
    .replace(/[^\x20-\x7E -ÿ–—]/g, "?");
}

function ist(isoText: string): string {
  return `${new Date(isoText).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} IST`;
}
