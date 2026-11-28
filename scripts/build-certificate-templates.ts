/**
 * Pictures behind the PowerPoint certificate export: the participation certificate (digital edition) with every
 * per-person part left out, one for each programme track, plus the layout that places the editable text boxes.
 *
 * Outputs, in assets/certificate-templates/:
 *   participation-rci.jpg      RCI CRE programme
 *   participation-online.jpg   regular online programme (non-RCI)
 *   layout.json                where the name, workplace, QR code, number and signatures go
 *
 * Run after changing the certificate design or wording in lib/certificate-pdf.ts:
 *   npx tsx scripts/build-certificate-templates.ts
 * Needs pdftoppm (poppler-utils).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { certificateTemplatePdf } from "../lib/certificate-pdf";

const out = path.join(process.cwd(), "assets", "certificate-templates");
const work = mkdtempSync(path.join(tmpdir(), "cert-template-"));

async function main() {
  let layout: unknown = null;
  for (const track of ["rci", "online"] as const) {
    const result = await certificateTemplatePdf(track, "digital");
    layout = result.layout;
    const pdfPath = path.join(work, `${track}.pdf`);
    writeFileSync(pdfPath, result.bytes);
    // 200 dpi: sharp on screen and in a PDF saved from PowerPoint, and small enough to keep the .pptx light.
    execFileSync("pdftoppm", ["-r", "200", "-jpeg", "-jpegopt", "quality=90", "-singlefile", pdfPath, path.join(out, `participation-${track}`)]);
    console.log(`assets/certificate-templates/participation-${track}.jpg`);
  }
  writeFileSync(path.join(out, "layout.json"), `${JSON.stringify(layout, null, 2)}\n`);
  console.log("assets/certificate-templates/layout.json");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => rmSync(work, { recursive: true, force: true }));
