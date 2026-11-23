/**
 * Uploaded documents attached to a registration.
 *
 * payment – receipt or screenshot of the Razorpay payment (required at registration)
 * crr     – CRR certificate or card (optional)
 * rci     – confirmation mail from the RCI portal, for those claiming CRE points (optional, can be added later)
 *
 * The browser shrinks photos before upload, so each file stays well under Vercel's 4.5 MB request limit.
 */
export const maxDocumentBytes = 1.5 * 1024 * 1024;

export type ProofKind = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
export type DocKind = "payment" | "crr" | "rci";

export const docKinds: DocKind[] = ["payment", "crr", "rci"];

export const docLabels: Record<DocKind, string> = {
  payment: "Payment receipt",
  crr: "CRR certificate",
  rci: "RCI confirmation",
};

export type ProofFile = {
  contentType: ProofKind;
  bytes: Buffer;
};

export function isDocKind(value: string): value is DocKind {
  return value === "payment" || value === "crr" || value === "rci";
}

export async function readProof(
  entry: FormDataEntryValue | null,
  label = "file",
): Promise<{ value: ProofFile } | { empty: true } | { error: string }> {
  if (!(entry instanceof File) || entry.size === 0 || entry.name === "") return { empty: true };
  if (entry.size > maxDocumentBytes) {
    return { error: `The ${label} must be a photo, screenshot or PDF under 1.5 MB.` };
  }
  const bytes = Buffer.from(await entry.arrayBuffer());
  const contentType = sniffDocument(bytes);
  if (!contentType) return { error: `Upload the ${label} as a JPEG, PNG, WebP or PDF.` };
  return { value: { contentType, bytes } };
}

export function isProofKind(value: string): value is ProofKind {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp" || value === "application/pdf";
}

export function extensionFor(kind: ProofKind): string {
  switch (kind) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "jpg";
  }
}

function sniffDocument(bytes: Buffer): ProofKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}
