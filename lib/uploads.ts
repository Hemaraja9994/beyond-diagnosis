import { readProof, type DocKind } from "@/lib/proof";
import type { DocumentUpload } from "@/lib/store";

const fieldFor: Record<DocKind, { field: string; label: string }> = {
  payment: { field: "receipt", label: "payment receipt" },
  crr: { field: "crrCertificate", label: "CRR certificate" },
  rci: { field: "rciConfirmation", label: "RCI confirmation" },
};

/** Reads the three optional file fields of a registration form. */
export async function readUploads(form: FormData): Promise<{ value: DocumentUpload[] } | { error: string }> {
  const uploads: DocumentUpload[] = [];
  for (const kind of Object.keys(fieldFor) as DocKind[]) {
    const { field, label } = fieldFor[kind];
    const read = await readProof(form.get(field), label);
    if ("error" in read) return { error: read.error };
    if ("value" in read) uploads.push({ kind, file: read.value });
  }
  return { value: uploads };
}
