import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import PptxGenJS from "pptxgenjs";
import type { CertificateLayout } from "@/lib/certificate-pdf";
import { certificateFooter, participantAffiliation } from "@/lib/certificate-pdf";
import { certificateIssueDate, participantName, rowCertificateNumber, type IssuedCertificate } from "@/lib/certificates";
import { certificateSignatories, isOnlineTrack, onlineProgramme, programme } from "@/lib/programme";
import type { Registration } from "@/lib/store";

/**
 * Certificates as a PowerPoint file, one A4-landscape slide per participant, so a coordinator can add
 * e-signatures before sending or printing.
 *
 * Each slide is the certificate picture (assets/certificate-templates, built by scripts/build-certificate-templates.ts)
 * with the name, workplace, and the certificate number and date as editable text boxes. The picture
 * sits on the slide master, so a signature inserted once on the master (View → Slide Master) appears on every
 * certificate in the file. Speaker notes on each slide carry the reference and email, for sending.
 */
const inch = 72;
const navy = "0F214A";
const muted = "5C6678";

type Item = { row: Registration; issued: IssuedCertificate };

let cached: Promise<{ layout: CertificateLayout; rci: string; online: string; measure: (text: string, size: number) => number }> | null = null;

function loadAssets() {
  cached ??= (async () => {
    const root = process.cwd();
    const dir = path.join(root, "assets", "certificate-templates");
    const [layoutText, rci, online, nameFont] = await Promise.all([
      readFile(path.join(dir, "layout.json"), "utf8"),
      readFile(path.join(dir, "participation-rci.jpg")),
      readFile(path.join(dir, "participation-online.jpg")),
      readFile(path.join(root, "assets", "certificate-fonts", "Fraunces-DisplayItalic.ttf")),
    ]);
    const font = fontkit.create(nameFont);
    return {
      layout: JSON.parse(layoutText) as CertificateLayout,
      rci: `image/jpeg;base64,${rci.toString("base64")}`,
      online: `image/jpeg;base64,${online.toString("base64")}`,
      measure: (text: string, size: number) => (font.layout(text).advanceWidth / font.unitsPerEm) * size,
    };
  })();
  return cached;
}

/** Text box for one line, centred on cx, with its baseline at y (PDF points from the bottom of the page). */
function line(layout: CertificateLayout, cx: number, baseline: number, width: number, size: number) {
  // PowerPoint places the first baseline about 0.95 em below the top of a box with no inner margin.
  return {
    x: (cx - width / 2) / inch,
    y: (layout.height - baseline - size * 0.95) / inch,
    w: width / inch,
    h: (size * 1.3) / inch,
    margin: 0,
    align: "center" as const,
    valign: "top" as const,
  };
}


/** One file per programme track, so each file has a single slide master to sign. */
export async function certificatesPptx(items: Item[], track: "rci" | "online"): Promise<Uint8Array> {
  const { layout, rci, online, measure } = await loadAssets();
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4L", width: layout.width / inch, height: layout.height / inch });
  pptx.layout = "A4L";
  pptx.author = `${programme.organiser}, ${programme.university}`;
  pptx.company = programme.university;
  pptx.title = `${programme.title} — Certificates of Participation`;
  pptx.subject = "Add e-signatures on the slide master (View → Slide Master), then save as PDF";
  const master = track === "online" ? "Online programme certificate" : "RCI CRE certificate";
  pptx.defineSlideMaster({ title: master, background: { data: track === "online" ? online : rci } });

  const signers = certificateSignatories.map((person) => person.name).join(", ");
  for (const { row, issued } of items) {
    const onlineRow = isOnlineTrack(row);
    if (onlineRow !== (track === "online")) continue;
    const slide = pptx.addSlide({ masterName: master });
    const name = participantName(row);
    const number = rowCertificateNumber(row, issued);

    // The name, shrunk to fit the line as on the PDF (Georgia stands in for Fraunces, slightly wider).
    let size = layout.nameStartSize;
    while (size > layout.nameMinSize && measure(name, size) * 1.1 > layout.nameMaxWidth) size -= 0.5;
    slide.addText(name, { ...line(layout, layout.width / 2, layout.nameBaseline, layout.nameMaxWidth + 60, size), fontFace: "Georgia", italic: true, fontSize: size, color: navy });

    const affiliation = participantAffiliation(row);
    if (affiliation) {
      slide.addText(affiliation, {
        ...line(layout, layout.width / 2, layout.affiliationBaseline, layout.affiliationMaxWidth, 9.6),
        fontFace: "Calibri",
        fontSize: 9.6,
        color: muted,
        fit: "shrink",
      });
    }

    slide.addText(certificateFooter(number, certificateIssueDate(issued), true), {
      ...line(layout, layout.width / 2, layout.footerBaseline, 640, 7),
      fontFace: "Calibri",
      fontSize: 7,
      color: muted,
    });

    slide.addNotes(
      [
        `${number} · ${row.reference}`,
        `${name} · ${row.email}`,
        onlineRow ? `${onlineProgramme.name} (non-RCI): no CRE points.` : "RCI CRE programme.",
        `Signatures (left to right): ${signers}. Add each once on the slide master (View → Slide Master) above its line; it then appears on every slide.`,
      ].join("\n"),
    );
  }

  const data = (await pptx.write({ outputType: "uint8array" })) as Uint8Array;
  return data;
}
