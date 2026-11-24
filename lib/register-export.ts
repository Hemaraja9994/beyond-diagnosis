import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { committee, professionLabel, programme, rciApprovalLine, type Profession } from "@/lib/programme";
import { paymentState, rciState, type PaymentState, type RciState } from "@/lib/status";
import type { Registration } from "@/lib/store";

/**
 * Printable participant register for the department's records: A4 landscape, college logo, programme details,
 * one row per participant, and signature lines for the organising team at the end.
 */
export type RegisterFilter = "all" | "confirmed" | "cre" | "pending";

export const filterLabels: Record<RegisterFilter, string> = {
  all: "All registrations",
  confirmed: "Payment confirmed",
  cre: "Claiming RCI CRE points",
  pending: "Payment still to be confirmed",
};

export function applyFilter(rows: Registration[], filter: RegisterFilter): Registration[] {
  const kept = rows.filter((row) => {
    if (filter === "confirmed") return paymentState(row) === "confirmed";
    if (filter === "pending") return paymentState(row) !== "confirmed";
    if (filter === "cre") return row.creClaim === "yes";
    return true;
  });
  return kept.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

const payShort: Record<PaymentState, string> = { confirmed: "Confirmed", pending: "Pending", rejected: "Not confirmed" };
const rciShort: Record<RciState, string> = {
  "not-claiming": "Not claiming",
  "not-stated": "—",
  awaited: "Awaited",
  submitted: "Under review",
  confirmed: "Confirmed",
  rejected: "Not accepted",
};

const columns = [
  { title: "Sl.", width: 24 },
  { title: "Reference", width: 86 },
  { title: "Name", width: 104 },
  { title: "Category", width: 72 },
  { title: "CRR", width: 50 },
  { title: "Email / Mobile", width: 116 },
  { title: "Workplace, State", width: 104 },
  { title: "Payment ID", width: 88 },
  { title: "Payment", width: 62 },
  { title: "RCI CRE", width: 66 },
] as const;

function cells(row: Registration, index: number): string[] {
  return [
    String(index + 1),
    row.reference,
    `${row.title ? `${row.title} ` : ""}${row.fullName}`,
    `${professionLabel(row.profession as Profession)}${row.professionDetail ? ` (${row.professionDetail})` : ""}`,
    row.crrNumber || "—",
    `${row.email}\n${row.mobile}`,
    [row.designation, row.institution, row.stateName].filter(Boolean).join(", "),
    row.paymentReference || "—",
    payShort[paymentState(row)],
    rciShort[rciState(row)],
  ];
}

function summaryLine(rows: Registration[]): string {
  const confirmed = rows.filter((row) => paymentState(row) === "confirmed").length;
  const cre = rows.filter((row) => row.creClaim === "yes").length;
  return `${rows.length} participants · payment confirmed ${confirmed} · claiming RCI CRE points ${cre}`;
}

function istNow(): string {
  return `${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} IST`;
}

async function logoBytes(): Promise<Buffer> {
  return readFile(path.join(process.cwd(), "public", "brand", "yenepoya-medical-college.png"));
}

/* ------------------------------- PDF -------------------------------- */

const navy = rgb(0.06, 0.13, 0.29);
const muted = rgb(0.36, 0.4, 0.47);
const orange = rgb(0.89, 0.34, 0.04);
const grid = rgb(0.8, 0.83, 0.87);
const band = rgb(0.93, 0.95, 0.97);

export async function registerPdf(rows: Registration[], filter: RegisterFilter, preparedBy: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Participant register — ${programme.title}`);
  pdf.setAuthor(`${programme.organiser}, ${programme.university}`);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(await logoBytes());
  const size: [number, number] = [841.89, 595.28];
  const left = 30;
  const bottom = 48;
  const fontSize = 7.5;
  const lineGap = 9.2;

  let page = pdf.addPage(size);
  let y = size[1] - 30;

  // Header block (first page)
  const logoW = 108;
  const logoH = (logo.height / logo.width) * logoW;
  page.drawImage(logo, { x: left, y: y - logoH, width: logoW, height: logoH });
  const hx = left + logoW + 16;
  page.drawText(safe(programme.organiser), { x: hx, y: y - 12, size: 12, font: bold, color: navy });
  page.drawText(safe(`${programme.hospital}, ${programme.university}, ${programme.city}`), { x: hx, y: y - 26, size: 9, font: regular, color: muted });
  page.drawText("PARTICIPANT REGISTER", { x: hx, y: y - 44, size: 13, font: bold, color: orange });
  page.drawText(safe(`${programme.title}: ${programme.subtitle}`), { x: hx, y: y - 58, size: 8.5, font: bold, color: navy });
  page.drawText(
    safe(`${programme.level} CRE · ${programme.dateLabel}, ${programme.start} · ${programme.mode} · Institute ${programme.instituteCode} · ${rciApprovalLine}`),
    { x: hx, y: y - 70, size: 8, font: regular, color: muted },
  );
  y = Math.min(y - logoH, y - 76) - 12;
  page.drawText(safe(`${filterLabels[filter]} — ${summaryLine(rows)}`), { x: left, y, size: 8.5, font: bold, color: navy });
  page.drawText(safe(`Prepared by ${preparedBy} · ${istNow()}`), { x: left + 470, y, size: 8, font: regular, color: muted });
  y -= 12;

  const drawHeader = () => {
    let x = left;
    page.drawRectangle({ x: left, y: y - 15, width: tableWidth(), height: 15, color: navy });
    for (const column of columns) {
      page.drawText(column.title, { x: x + 3, y: y - 10.5, size: 7.5, font: bold, color: rgb(1, 1, 1) });
      x += column.width;
    }
    y -= 15;
  };
  drawHeader();

  if (rows.length === 0) {
    y -= 14;
    page.drawText("No participants match this selection.", { x: left + 4, y, size: 9, font: regular, color: muted });
  }

  rows.forEach((row, index) => {
    const values = cells(row, index);
    const wrapped = values.map((value, i) => wrap(value, regular, fontSize, columns[i].width - 6));
    const height = Math.max(...wrapped.map((lines) => lines.length)) * lineGap + 6;
    if (y - height < bottom) {
      page = pdf.addPage(size);
      y = size[1] - 30;
      drawHeader();
    }
    if (index % 2 === 1) page.drawRectangle({ x: left, y: y - height, width: tableWidth(), height, color: band });
    let x = left;
    wrapped.forEach((lines, i) => {
      lines.forEach((piece, n) => {
        page.drawText(piece, { x: x + 3, y: y - 9 - n * lineGap, size: fontSize, font: i === 2 ? bold : regular, color: navy });
      });
      x += columns[i].width;
    });
    page.drawLine({ start: { x: left, y: y - height }, end: { x: left + tableWidth(), y: y - height }, thickness: 0.5, color: grid });
    y -= height;
  });

  // Signature lines
  const needed = 90;
  if (y - needed < bottom) {
    page = pdf.addPage(size);
    y = size[1] - 40;
  }
  y -= 54;
  const seats = committee.flatMap((seat) => seat.names.map((name) => ({ role: seat.role, name })));
  const slot = tableWidth() / seats.length;
  seats.forEach((seat, i) => {
    const x = left + i * slot + 10;
    page.drawLine({ start: { x, y: y + 12 }, end: { x: x + slot - 40, y: y + 12 }, thickness: 0.6, color: navy });
    page.drawText(safe(seat.name), { x, y, size: 9, font: bold, color: navy });
    page.drawText(safe(seat.role), { x, y: y - 11, size: 8, font: regular, color: muted });
  });

  // Page numbers
  const pages = pdf.getPages();
  pages.forEach((p, i) => footer(p, `Page ${i + 1} of ${pages.length}`, regular));
  return pdf.save();
}

function footer(page: PDFPage, label: string, font: PDFFont) {
  const text = safe(`${programme.title} · RCI F. No. ${programme.rciFileNo} · ${label}`);
  page.drawText(text, { x: (page.getWidth() - font.widthOfTextAtSize(text, 7.5)) / 2, y: 22, size: 7.5, font, color: muted });
}

function tableWidth(): number {
  return columns.reduce((sum, column) => sum + column.width, 0);
}

function wrap(value: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const paragraph of safe(value).split("\n")) {
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      let piece = word;
      // Break very long words (emails, ids) so they never overflow the cell.
      while (font.widthOfTextAtSize(piece, size) > width) {
        let cut = piece.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(piece.slice(0, cut), size) > width) cut -= 1;
        if (current) {
          out.push(current);
          current = "";
        }
        out.push(piece.slice(0, cut));
        piece = piece.slice(cut);
      }
      const next = current ? `${current} ${piece}` : piece;
      if (font.widthOfTextAtSize(next, size) <= width) current = next;
      else {
        out.push(current);
        current = piece;
      }
    }
    out.push(current);
  }
  return out.length > 0 ? out : [""];
}

function safe(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/₹/g, "Rs. ")
    .replace(/[^\x20-\x7E\n -ÿ–—]/g, "?");
}

/* ------------------------------- Word ------------------------------- */

export async function registerDocx(rows: Registration[], filter: RegisterFilter, preparedBy: string): Promise<Buffer> {
  const logo = await logoBytes();
  const thin = { style: BorderStyle.SINGLE, size: 4, color: "C9D1DA" };
  const borders = { top: thin, bottom: thin, left: thin, right: thin };
  const total = tableWidth();
  const cell = (text: string, width: number, header = false, boldText = false) =>
    new TableCell({
      width: { size: Math.round((width / total) * 100), type: WidthType.PERCENTAGE },
      borders,
      shading: header ? { fill: "0F214A" } : undefined,
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: text.split("\n").map(
        (piece) =>
          new Paragraph({
            children: [new TextRun({ text: piece, size: 15, bold: header || boldText, color: header ? "FFFFFF" : "0F214A", font: "Calibri" })],
          }),
      ),
    });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: columns.map((column) => cell(column.title, column.width, true)) }),
      ...rows.map(
        (row, index) =>
          new TableRow({ cantSplit: true, children: cells(row, index).map((value, i) => cell(value, columns[i].width, false, i === 2)) }),
      ),
    ],
  });

  const seats = committee.flatMap((seat) => seat.names.map((name) => ({ role: seat.role, name })));
  const run = (text: string, options: { bold?: boolean; size?: number; color?: string } = {}) =>
    new TextRun({ text, font: "Calibri", size: options.size ?? 18, bold: options.bold, color: options.color ?? "0F214A" });

  const doc = new Document({
    creator: `${programme.organiser}, ${programme.university}`,
    title: `Participant register — ${programme.title}`,
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 },
            margin: { top: 700, bottom: 700, left: 600, right: 600 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  run(`${programme.title} · RCI F. No. ${programme.rciFileNo} · Page `, { size: 14, color: "5C6678" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "5C6678", font: "Calibri" }),
                  run(" of ", { size: 14, color: "5C6678" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "5C6678", font: "Calibri" }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [new ImageRun({ type: "png", data: logo, transformation: { width: 150, height: Math.round(150 * (257 / 474)) } })],
          }),
          new Paragraph({ children: [run(programme.organiser, { bold: true, size: 26 })] }),
          new Paragraph({ children: [run(`${programme.hospital}, ${programme.university}, ${programme.city}`, { size: 18, color: "5C6678" })] }),
          new Paragraph({ spacing: { before: 160 }, children: [run("PARTICIPANT REGISTER", { bold: true, size: 28, color: "E4570B" })] }),
          new Paragraph({ children: [run(`${programme.title}: ${programme.subtitle}`, { bold: true, size: 19 })] }),
          new Paragraph({
            children: [
              run(
                `${programme.level} CRE · ${programme.dateLabel}, ${programme.start} · ${programme.mode} · Institute ${programme.instituteCode} · ${rciApprovalLine}`,
                { size: 17, color: "5C6678" },
              ),
            ],
          }),
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [run(`${filterLabels[filter]} — ${summaryLine(rows)}`, { bold: true }), run(`    Prepared by ${preparedBy} · ${istNow()}`, { color: "5C6678" })],
          }),
          rows.length > 0 ? table : new Paragraph({ children: [run("No participants match this selection.")] }),
          new Paragraph({ spacing: { before: 900 }, children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
            rows: [
              new TableRow({
                children: seats.map(
                  (seat) =>
                    new TableCell({
                      borders: { top: { style: BorderStyle.SINGLE, size: 6, color: "0F214A" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
                      margins: { left: 200, right: 200 },
                      children: [new Paragraph({ children: [run(seat.name, { bold: true })] }), new Paragraph({ children: [run(seat.role, { size: 16, color: "5C6678" })] })],
                    }),
                ),
              }),
            ],
          }),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
