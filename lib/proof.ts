const maxProofBytes = 3 * 1024 * 1024;

export type ProofKind = "image/jpeg" | "image/png" | "image/webp";

export type ProofFile = {
  contentType: ProofKind;
  bytes: Buffer;
};

export async function readProof(
  entry: FormDataEntryValue | null,
): Promise<{ value: ProofFile } | { empty: true } | { error: string }> {
  if (!(entry instanceof File) || entry.size === 0 || entry.name === "") return { empty: true };
  if (entry.size > maxProofBytes) return { error: "The screenshot must be a JPEG, PNG, or WebP under 3 MB." };
  const bytes = Buffer.from(await entry.arrayBuffer());
  const contentType = sniffImage(bytes);
  if (!contentType) return { error: "Upload a JPEG, PNG, or WebP screenshot of the payment." };
  return { value: { contentType, bytes } };
}

function sniffImage(bytes: Buffer): ProofKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
