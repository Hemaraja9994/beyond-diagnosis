import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, cmyk, degrees, rgb, type Color, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { certificateNumberText, participantName, type IssuedCertificate } from "@/lib/certificates";
import { certificateSignatories, programme, sessions } from "@/lib/programme";
import type { Registration } from "@/lib/store";

/**
 * E-certificates — A4 landscape — for participants (Certificate of Participation) and resource persons
 * (Certificate of Appreciation), each in two editions:
 *
 *  digital – cream sheet in a full navy frame, scanned signatures where supplied; made for screens and sharing
 *  print   – white paper area, frame kept inside the printer's safe margin, CMYK colours, empty signature
 *            lines for ink; print on 200–300 gsm cream or white certificate card at 100% (actual size)
 *
 * Shared design: guilloche (security-print) border, corner rosettes, the university shield as a watermark,
 * a gold seal with ribbons, and a QR code. Type is Fraunces and Outfit — the website's own families — embedded
 * and subset. Everything except the logos is vector, so it prints sharply at any size.
 */
const W = 841.89;
const H = 595.28;

export type Edition = "digital" | "print";
type Kind = "participation" | "resource";

type Palette = { paper: Color; navy: Color; ink: Color; muted: Color; orange: Color; orangeDeep: Color; gold: Color; goldLight: Color; goldBright: Color; cream: Color };

function palette(edition: Edition): Palette {
  const hexes = {
    paper: edition === "print" ? "#FFFFFF" : "#FBF8F0",
    navy: "#0F214A",
    ink: "#22304F",
    muted: "#5C6678",
    orange: "#E4570B",
    orangeDeep: "#B9420A",
    gold: "#B08D3E",
    goldLight: "#D9C28C",
    goldBright: "#C9A24B",
    cream: "#FBF8F0",
  };
  const make = edition === "print" ? toCmyk : toRgb;
  return Object.fromEntries(Object.entries(hexes).map(([key, value]) => [key, make(value)])) as Palette;
}

function channels(value: string): [number, number, number] {
  return [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16) / 255) as [number, number, number];
}

function toRgb(value: string): Color {
  return rgb(...channels(value));
}

/** Plain RGB→CMYK; good enough for an office or digital press, and it keeps blacks out of the navy. */
function toCmyk(value: string): Color {
  const [r, g, b] = channels(value);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return cmyk(0, 0, 0, 1);
  return cmyk((1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k);
}

/* Colours used by the drawing helpers; set at the start of each (synchronous) drawing pass. */
let paper: Color, navy: Color, ink: Color, muted: Color, orange: Color, orangeDeep: Color, gold: Color, goldLight: Color, goldBright: Color, cream: Color;
let edition: Edition = "digital";

function applyPalette(value: Edition) {
  edition = value;
  ({ paper, navy, ink, muted, orange, orangeDeep, gold, goldLight, goldBright, cream } = palette(value));
}

type Fonts = {
  displayItalic: PDFFont;
  displaySemibold: PDFFont;
  text: PDFFont;
  textItalic: PDFFont;
  textSemibold: PDFFont;
  sans: PDFFont;
  sansSemibold: PDFFont;
};

const fontFiles = {
  displayItalic: "Fraunces-DisplayItalic.ttf",
  displaySemibold: "Fraunces-DisplaySemibold.ttf",
  text: "Fraunces-Text.ttf",
  textItalic: "Fraunces-TextItalic.ttf",
  textSemibold: "Fraunces-TextSemibold.ttf",
  sans: "Outfit-Regular.ttf",
  sansSemibold: "Outfit-SemiBold.ttf",
} as const;

/** File bytes are read once per server instance and reused for every certificate. */
let assets: Promise<{ fonts: Record<keyof Fonts, Uint8Array>; logo: Uint8Array; rci: Uint8Array; shield: Uint8Array; signatures: (Uint8Array | null)[] }> | null = null;

function loadAssets() {
  assets ??= (async () => {
    const root = process.cwd();
    const entries = await Promise.all(
      Object.entries(fontFiles).map(async ([key, file]) => [key, await readFile(path.join(root, "assets", "certificate-fonts", file))] as const),
    );
    const [logo, rci, shield, ...signatures] = await Promise.all([
      readFile(path.join(root, "public", "brand", "yenepoya-medical-college-clear.png")),
      readFile(path.join(root, "public", "brand", "rci-clear.png")),
      readFile(path.join(root, "public", "brand", "yenepoya-shield-watermark.png")),
      ...certificateSignatories.map((person) => readFile(path.join(root, "public", "brand", "signatures", `${person.key}.png`)).catch(() => null)),
    ]);
    return { fonts: Object.fromEntries(entries) as unknown as Record<keyof Fonts, Uint8Array>, logo, rci, shield, signatures };
  })();
  return assets;
}

type Spec = {
  kind: Kind;
  edition: Edition;
  name: string;
  affiliation: string;
  number: string;
  specimen: boolean;
  issuedAt: string;
  qrUrl: string;
  qrCaption: string;
  session?: string;
};

/** A participant's Certificate of Participation. Number 0 prints a SPECIMEN for desk previews. */
export function certificatePdf(row: Registration, issued: IssuedCertificate, verifyUrl: string, edition: Edition = "digital"): Promise<Uint8Array> {
  return render({
    kind: "participation",
    edition,
    name: participantName(row),
    affiliation: [row.designation, row.institution].map((part) => part.trim()).filter(Boolean).join(", "),
    number: certificateNumberText(issued.number),
    specimen: issued.number === 0,
    issuedAt: issued.issuedAt,
    qrUrl: verifyUrl,
    qrCaption: "SCAN TO VERIFY",
  });
}

/** Resource persons, in session order: RP-01 … RP-04. */
export const resourcePersons = sessions.map((session, index) => ({
  key: `RP-${String(index + 1).padStart(2, "0")}`,
  name: session.person,
  designation: session.designation,
  title: session.title,
  time: `${session.time} ${session.meridiem}`,
}));

/** A resource person's Certificate of Appreciation. The QR opens the programme page that lists the session. */
export function resourceCertificatePdf(person: (typeof resourcePersons)[number], origin: string, edition: Edition = "print"): Promise<Uint8Array> {
  return render({
    kind: "resource",
    edition,
    name: person.name,
    affiliation: person.designation,
    number: `${certificateNumberText(1).replace(/0001$/, "")}${person.key}`,
    specimen: false,
    issuedAt: `${programme.sessionsOpenAt.slice(0, 10)}T12:00:00+05:30`,
    qrUrl: `${origin}/programme`,
    qrCaption: "VIEW PROGRAMME",
    session: person.title,
  });
}

async function render(spec: Spec): Promise<Uint8Array> {
  const files = await loadAssets();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const heading = spec.kind === "resource" ? "Certificate of Appreciation" : "Certificate of Participation";
  pdf.setTitle(`${heading} — ${spec.name}`);
  pdf.setAuthor(`${programme.organiser}, ${programme.hospital}, ${programme.university}`);
  pdf.setSubject(`${programme.title}: ${programme.subtitle} · ${programme.dateLabel}`);
  pdf.setKeywords([heading, "Zonal CRE", "RPwD Act 2016", "Yenepoya", spec.number, spec.edition === "print" ? "Print edition" : "Digital edition"]);
  pdf.setCreator("Beyond the Diagnosis CRE desk");
  pdf.setProducer("Yenepoya ASLP");

  const fonts = Object.fromEntries(
    await Promise.all(Object.entries(files.fonts).map(async ([key, bytes]) => [key, await pdf.embedFont(bytes, { subset: true })] as const)),
  ) as Fonts;
  const logo = await pdf.embedPng(files.logo);
  const rciLogo = await pdf.embedPng(files.rci);
  const shield = await pdf.embedPng(files.shield);
  const signatures =
    spec.edition === "print" ? certificateSignatories.map(() => null) : await Promise.all(files.signatures.map((bytes) => (bytes ? pdf.embedPng(bytes).catch(() => null) : null)));
  const qr = await pdf.embedPng(
    await QRCode.toBuffer(spec.qrUrl, { type: "png", margin: 0, width: 360, errorCorrectionLevel: "M", color: { dark: "#0F214Aff", light: "#00000000" } }),
  );

  // Everything from here to save() is synchronous, so the palette cannot change mid-drawing.
  applyPalette(spec.edition);
  const page = pdf.addPage([W, H]);
  drawFrame(page);
  page.drawImage(shield, { x: W / 2 - 118, y: H / 2 - 168, width: 236, height: (shield.height / shield.width) * 236, opacity: spec.edition === "print" ? 0.06 : 0.075 });

  // Header: college logo and the RCI logo side by side, then department and university
  const logoW = 118;
  const logoH = (logo.height / logo.width) * logoW;
  const rciH = logoH * 0.92;
  const rciW = (rciLogo.width / rciLogo.height) * rciH;
  const gap = 26;
  const pairW = logoW + gap + rciW;
  const left = W / 2 - pairW / 2;
  page.drawImage(logo, { x: left, y: H - 64 - logoH, width: logoW, height: logoH });
  page.drawLine({ start: { x: left + logoW + gap / 2, y: H - 64 - logoH + 6 }, end: { x: left + logoW + gap / 2, y: H - 64 - 6 }, thickness: 0.6, color: gold });
  page.drawImage(rciLogo, { x: left + logoW + gap, y: H - 64 - logoH + (logoH - rciH) / 2, width: rciW, height: rciH });
  let y = H - 64 - logoH - 15;
  spaced(page, programme.organiser.toUpperCase(), W / 2, y, fonts.sansSemibold, 8.4, 1.5, navy);
  y -= 12.5;
  centre(page, `${programme.hospital} · ${programme.university}, ${programme.city}`, y, fonts.sans, 8.4, muted);

  // Title
  y -= 42;
  spaced(page, "CERTIFICATE", W / 2, y, fonts.displaySemibold, 34, 8.5, navy);
  y -= 27;
  centre(page, spec.kind === "resource" ? "of Appreciation" : "of Participation", y, fonts.displayItalic, 23, orange);
  y -= 15;
  divider(page, W / 2, y, 92);

  // Recipient
  y -= 24;
  centre(page, spec.kind === "resource" ? "This certificate is gratefully presented to" : "This is to certify that", y, fonts.textItalic, 12.5, muted);
  y -= 41;
  const nameSize = fitSize(fonts.displayItalic, spec.name, 40, 580, 24);
  centre(page, spec.name, y, fonts.displayItalic, nameSize, navy);
  const nameWidth = Math.max(fonts.displayItalic.widthOfTextAtSize(spec.name, nameSize) + 56, 300);
  y -= 11;
  page.drawLine({ start: { x: W / 2 - nameWidth / 2, y }, end: { x: W / 2 + nameWidth / 2, y }, thickness: 0.7, color: gold });
  diamond(page, W / 2 - nameWidth / 2, y, 2.6, gold);
  diamond(page, W / 2 + nameWidth / 2, y, 2.6, gold);
  diamond(page, W / 2, y, 3.4, orange);
  y -= 15;
  if (spec.affiliation) centre(page, clip(fonts.sans, spec.affiliation, 9.6, 600), y, fonts.sans, 9.6, muted);

  // Citation
  const body = fonts.text;
  const strong = fonts.textSemibold;
  const programmeName = `“${programme.title}: ${programme.subtitle}”`;
  if (spec.kind === "resource") {
    y -= 21;
    y = richCentred(page, [[{ text: "in grateful appreciation of the invited lecture delivered as a Resource Person on", font: body }]], y, 10.9, 15.2, 640, ink);
    y = richCentred(page, [[{ text: `“${spec.session ?? ""}”`, font: fonts.textItalic }]], y, 11.4, 15.2, 600, navy);
    y = richCentred(
      page,
      [
        [
          { text: "at the Zonal Continuing Rehabilitation Education (CRE) programme", font: body },
          { text: programmeName, font: strong },
          { text: `organised by the ${programme.organiser}, ${programme.hospital}, ${programme.city}, held online on`, font: body },
          { text: `${programme.dateLabel}.`, font: strong },
        ],
      ],
      y,
      10.9,
      15.2,
      660,
      ink,
    );
    y -= 6;
  } else {
    y -= 22;
    y = richCentred(page, [[{ text: "has participated in the Zonal Continuing Rehabilitation Education (CRE) programme", font: body }]], y, 11.3, 16, 640, ink);
    y = richCentred(page, [[{ text: programmeName, font: strong }]], y, 11.3, 16, 600, navy);
    y = richCentred(
      page,
      [
        [
          { text: `organised by the ${programme.organiser}, ${programme.hospital}, ${programme.city}, held online on`, font: body },
          { text: `${programme.dateLabel}.`, font: strong },
        ],
      ],
      y,
      11.3,
      16,
      640,
      ink,
    );
  }

  // RCI approval of the programme
  y -= 16;
  centre(
    page,
    `Approved by the Rehabilitation Council of India  ·  Letter F. No. ${programme.rciFileNo}  ·  ${programme.level} CRE, ${programme.rciHours} hours  ·  Institute code ${programme.instituteCode}`,
    y,
    fonts.sansSemibold,
    8.4,
    navy,
  );

  // Seal and QR flank the header; the signatures run along the bottom
  seal(page, 152, 466, fonts);
  verification(page, W - 152, 436, qr, spec.number, spec.qrCaption, fonts);
  const span = W - 2 * 92;
  const column = span / certificateSignatories.length;
  certificateSignatories.forEach((person, index) => {
    signatureBlock(page, 92 + column * (index + 0.5), 106, signatures[index], person, column - 26, fonts);
  });

  // Footer microtext, inside the frame
  const footer = [
    `Certificate No. ${spec.number}`,
    `Issued ${istDate(spec.issuedAt)}`,
    spec.kind === "participation" ? (spec.edition === "print" ? "Verify with the QR code" : "Electronically issued; verify with the QR code") : "",
  ].filter(Boolean);
  centre(page, footer.join("  ·  "), 57, fonts.sans, 6.6, muted);

  if (spec.specimen) {
    const word = "SPECIMEN";
    const size = 120;
    const width = fonts.displaySemibold.widthOfTextAtSize(word, size);
    const rad = Math.atan2(H, W);
    page.drawText(word, {
      x: W / 2 - (width / 2) * Math.cos(rad) + (size / 3) * Math.sin(rad),
      y: H / 2 - (width / 2) * Math.sin(rad) - (size / 3) * Math.cos(rad),
      size,
      font: fonts.displaySemibold,
      color: orange,
      opacity: 0.12,
      rotate: degrees((rad * 180) / Math.PI),
    });
  }

  return pdf.save();
}

/* ------------------------------------------------------------------ */
/* Frame, guilloche border and rosettes                                 */
/* ------------------------------------------------------------------ */

function drawFrame(page: PDFPage) {
  if (edition === "print") {
    // No ink to the paper edge: office printers leave about 4 mm unprinted, so the frame starts at 12 pt (4.2 mm).
    page.drawRectangle({ x: 15, y: 15, width: W - 30, height: H - 30, borderColor: navy, borderWidth: 6, opacity: 0 });
    rect(page, 20.5, 0.45, gold);
  } else {
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: navy });
    page.drawRectangle({ x: 13, y: 13, width: W - 26, height: H - 26, color: paper });
    rect(page, 18, 0.9, gold);
    rect(page, 20.5, 0.35, gold);
  }
  // Guilloche band between 24 and 44
  const band = { inner: 44, outer: 24 };
  const mid = (band.inner + band.outer) / 2;
  const amp = (band.inner - band.outer) / 2 - 1.2;
  const sides: { from: [number, number]; to: [number, number] }[] = [
    { from: [62, mid], to: [W - 62, mid] }, // top (SVG y grows downward)
    { from: [62, H - mid], to: [W - 62, H - mid] }, // bottom
    { from: [mid, 62], to: [mid, H - 62] }, // left
    { from: [W - mid, 62], to: [W - mid, H - 62] }, // right
  ];
  for (const side of sides) {
    const strands: [number, number, number][] = [
      [0, amp, 0.42],
      [(2 * Math.PI) / 3, amp, 0.42],
      [(4 * Math.PI) / 3, amp, 0.42],
      [Math.PI / 3, amp * 0.55, 0.3],
      [Math.PI, amp * 0.55, 0.3],
      [(5 * Math.PI) / 3, amp * 0.55, 0.3],
    ];
    for (const [phase, a, width] of strands) {
      page.drawSvgPath(wave(side.from, side.to, a, 15, phase), { x: 0, y: H, borderColor: gold, borderWidth: width, borderOpacity: 0.85 });
    }
  }
  rect(page, band.outer, 0.5, gold);
  rect(page, band.inner, 0.5, gold);
  rect(page, 47, 0.9, gold);
  for (const [cx, cy] of [
    [mid, mid],
    [W - mid, mid],
    [mid, H - mid],
    [W - mid, H - mid],
  ] as [number, number][]) {
    page.drawCircle({ x: cx, y: cy, size: 17, color: paper, borderColor: gold, borderWidth: 0.6 });
    page.drawSvgPath(rosette(cx, H - cy, 15.5), { x: 0, y: H, borderColor: gold, borderWidth: 0.35 });
    page.drawCircle({ x: cx, y: cy, size: 2.2, color: orange });
  }
}

function rect(page: PDFPage, inset: number, thickness: number, colour: Color) {
  page.drawRectangle({ x: inset, y: inset, width: W - inset * 2, height: H - inset * 2, borderColor: colour, borderWidth: thickness, opacity: 0 });
}

/** A sine strand from one point to another, with a whole number of waves so the ends meet the rosettes cleanly. */
function wave(from: [number, number], to: [number, number], amplitude: number, wavelength: number, phase: number): string {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const length = Math.hypot(x1 - x0, y1 - y0);
  const waves = Math.max(1, Math.round(length / wavelength));
  const ux = (x1 - x0) / length;
  const uy = (y1 - y0) / length;
  const steps = waves * 14;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const offset = amplitude * Math.sin(2 * Math.PI * waves * t + phase);
    const x = x0 + ux * length * t - uy * offset;
    const y = y0 + uy * length * t + ux * offset;
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return parts.join(" ");
}

/** A spirograph (hypotrochoid) rosette, the classic engraved-certificate ornament. */
function rosette(cx: number, cy: number, radius: number): string {
  const R = 7;
  const r = 3;
  const d = 5.2;
  const scale = radius / (R - r + d);
  const parts: string[] = [];
  const steps = 720;
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * 2 * Math.PI * 3;
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    parts.push(`${i === 0 ? "M" : "L"}${(cx + x * scale).toFixed(2)} ${(cy + y * scale).toFixed(2)}`);
  }
  return parts.join(" ");
}

function divider(page: PDFPage, cx: number, y: number, half: number) {
  page.drawLine({ start: { x: cx - half, y }, end: { x: cx - 9, y }, thickness: 0.6, color: gold });
  page.drawLine({ start: { x: cx + 9, y }, end: { x: cx + half, y }, thickness: 0.6, color: gold });
  diamond(page, cx, y, 4, gold);
  diamond(page, cx, y, 1.8, paper);
  page.drawCircle({ x: cx - half - 3, y, size: 1.1, color: gold });
  page.drawCircle({ x: cx + half + 3, y, size: 1.1, color: gold });
}

function diamond(page: PDFPage, cx: number, cy: number, size: number, colour: Color) {
  page.drawSvgPath(`M ${cx} ${H - cy - size} L ${cx + size} ${H - cy} L ${cx} ${H - cy + size} L ${cx - size} ${H - cy} Z`, { x: 0, y: H, color: colour });
}

/* ------------------------------------------------------------------ */
/* Seal, signature, verification                                        */
/* ------------------------------------------------------------------ */

function seal(page: PDFPage, cx: number, cy: number, fonts: Fonts) {
  const sy = H - cy; // SVG coordinates
  // Ribbon tails
  const tail = (dx: number, colour: Color) =>
    page.drawSvgPath(
      `M ${cx + dx * 10} ${sy + 18} L ${cx + dx * 31} ${sy + 52} L ${cx + dx * 23} ${sy + 48} L ${cx + dx * 18} ${sy + 60} L ${cx + dx * 2} ${sy + 26} Z`,
      { x: 0, y: H, color: colour },
    );
  tail(-1, orange);
  tail(1, orangeDeep);
  // Starburst edge
  const points: string[] = [];
  const spikes = 40;
  for (let i = 0; i < spikes * 2; i += 1) {
    const angle = (Math.PI * i) / spikes;
    const radius = i % 2 === 0 ? 45 : 41.5;
    points.push(`${i === 0 ? "M" : "L"}${(cx + radius * Math.sin(angle)).toFixed(2)} ${(sy - radius * Math.cos(angle)).toFixed(2)}`);
  }
  page.drawSvgPath(`${points.join(" ")} Z`, { x: 0, y: H, color: goldBright });
  page.drawCircle({ x: cx, y: cy, size: 38.5, color: gold });
  page.drawCircle({ x: cx, y: cy, size: 36.5, borderColor: cream, borderWidth: 0.6, opacity: 0, borderOpacity: 0.9 });
  page.drawCircle({ x: cx, y: cy, size: 21.5, borderColor: cream, borderWidth: 0.5, opacity: 0, borderOpacity: 0.9 });
  page.drawSvgPath(rosette(cx, sy, 19), { x: 0, y: H, borderColor: goldLight, borderWidth: 0.3, borderOpacity: 0.9 });
  circleText(page, "YENEPOYA  •  DEPARTMENT OF ASLP  •  ZONAL CRE  •  MANGALURU  •  ", cx, cy, 28.5, fonts.sansSemibold, 5.6, cream);
  centreAt(page, "RPwD", cx, cy + 1, fonts.displaySemibold, 11.5, cream);
  centreAt(page, "ACT  2016", cx, cy - 8, fonts.sansSemibold, 5.6, cream);
  centreAt(page, "2026", cx, cy + 11, fonts.sansSemibold, 5.6, cream);
}

function signatureBlock(
  page: PDFPage,
  cx: number,
  lineY: number,
  signature: PDFImage | null,
  person: (typeof certificateSignatories)[number],
  width: number,
  fonts: Fonts,
) {
  if (signature) {
    const maxW = width - 10;
    const maxH = 40;
    const scale = Math.min(maxW / signature.width, maxH / signature.height);
    const w = signature.width * scale;
    const h = signature.height * scale;
    page.drawImage(signature, { x: cx - w / 2, y: lineY + 3, width: w, height: h });
  }
  page.drawLine({ start: { x: cx - width / 2, y: lineY }, end: { x: cx + width / 2, y: lineY }, thickness: 0.7, color: navy });
  centreAt(page, person.name, cx, lineY - 14.5, fonts.textSemibold, fitSize(fonts.textSemibold, person.name, 11, width + 6, 8.5), navy);
  centreAt(page, person.role, cx, lineY - 26.5, fonts.sansSemibold, 8.2, orange);
  centreAt(page, person.place, cx, lineY - 37, fonts.sans, 8, muted);
}

function verification(page: PDFPage, cx: number, bottom: number, qr: PDFImage, number: string, caption: string, fonts: Fonts) {
  const size = 62;
  page.drawRectangle({ x: cx - size / 2 - 5, y: bottom - 5, width: size + 10, height: size + 10, borderColor: goldLight, borderWidth: 0.6, color: paper });
  page.drawImage(qr, { x: cx - size / 2, y: bottom, width: size, height: size });
  centreAt(page, caption, cx, bottom - 17, fonts.sansSemibold, 6.8, navy, 1.2);
  centreAt(page, number, cx, bottom - 28, fonts.sans, 7.4, muted);
}

/* ------------------------------------------------------------------ */
/* Type helpers                                                         */
/* ------------------------------------------------------------------ */

function centre(page: PDFPage, value: string, y: number, font: PDFFont, size: number, colour: Color) {
  centreAt(page, value, W / 2, y, font, size, colour);
}

function centreAt(page: PDFPage, value: string, cx: number, y: number, font: PDFFont, size: number, colour: Color, tracking = 0) {
  if (tracking > 0) return spaced(page, value, cx, y, font, size, tracking, colour);
  page.drawText(value, { x: cx - font.widthOfTextAtSize(value, size) / 2, y, size, font, color: colour });
}

/** Letter-spaced capitals, centred on cx. */
function spaced(page: PDFPage, value: string, cx: number, y: number, font: PDFFont, size: number, tracking: number, colour: Color) {
  const chars = [...value];
  const total = chars.reduce((sum, char) => sum + font.widthOfTextAtSize(char, size), 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  for (const char of chars) {
    page.drawText(char, { x, y, size, font, color: colour });
    x += font.widthOfTextAtSize(char, size) + tracking;
  }
}

/** Text around a circle, reading clockwise from the top. */
function circleText(page: PDFPage, value: string, cx: number, cy: number, radius: number, font: PDFFont, size: number, colour: Color) {
  const chars = [...value];
  const widths = chars.map((char) => font.widthOfTextAtSize(char, size));
  const total = widths.reduce((sum, w) => sum + w, 0);
  const spread = (2 * Math.PI * radius) / total; // stretch to close the ring exactly
  let arc = 0;
  chars.forEach((char, index) => {
    const w = widths[index] * spread;
    const angle = (arc + w / 2) / radius;
    const x = cx + radius * Math.sin(angle);
    const y = cy + radius * Math.cos(angle);
    const half = widths[index] / 2;
    page.drawText(char, {
      x: x - half * Math.cos(angle),
      y: y + half * Math.sin(angle),
      size,
      font,
      color: colour,
      rotate: degrees((-angle * 180) / Math.PI),
    });
    arc += w;
  });
}

type Run = { text: string; font: PDFFont };

type Word = { text: string; font: PDFFont };

function wrap(words: Word[], size: number, maxWidth: number): Word[][] {
  const lines: Word[][] = [];
  let line: Word[] = [];
  let width = 0;
  for (const word of words) {
    const w = word.font.widthOfTextAtSize(word.text, size);
    const space = line.length > 0 ? word.font.widthOfTextAtSize(" ", size) : 0;
    if (line.length > 0 && width + space + w > maxWidth) {
      lines.push(line);
      line = [word];
      width = w;
    } else {
      line.push(word);
      width += space + w;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

/**
 * Wraps mixed-font text into evenly balanced, centred lines (no lone word on the last line);
 * returns the baseline below the block.
 */
function richCentred(page: PDFPage, paragraphs: Run[][], y: number, size: number, leading: number, maxWidth: number, colour: Color): number {
  for (const runs of paragraphs) {
    const words = runs.flatMap((run) => run.text.split(/\s+/).filter(Boolean).map((text) => ({ text, font: run.font })));
    const count = wrap(words, size, maxWidth).length;
    // Narrow the measure as far as possible without adding a line, so the lines come out even.
    let low = maxWidth * 0.4;
    let high = maxWidth;
    for (let step = 0; step < 18 && count > 1; step += 1) {
      const middle = (low + high) / 2;
      if (wrap(words, size, middle).length > count) low = middle;
      else high = middle;
    }
    for (const line of wrap(words, size, high)) {
      const total = line.reduce((sum, word, index) => sum + word.font.widthOfTextAtSize(word.text, size) + (index > 0 ? word.font.widthOfTextAtSize(" ", size) : 0), 0);
      let x = W / 2 - total / 2;
      line.forEach((word, index) => {
        if (index > 0) x += word.font.widthOfTextAtSize(" ", size);
        page.drawText(word.text, { x, y, size, font: word.font, color: colour });
        x += word.font.widthOfTextAtSize(word.text, size);
      });
      y -= leading;
    }
  }
  return y;
}

function fitSize(font: PDFFont, value: string, start: number, maxWidth: number, min: number): number {
  let size = start;
  while (size > min && font.widthOfTextAtSize(value, size) > maxWidth) size -= 0.5;
  return size;
}

function clip(font: PDFFont, value: string, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  let cut = value;
  while (cut.length > 4 && font.widthOfTextAtSize(`${cut}…`, size) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function istDate(isoText: string): string {
  return new Date(isoText).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });
}
