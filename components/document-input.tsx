"use client";

import { useEffect, useState } from "react";

const maxBytes = 1.5 * 1024 * 1024;
const maxSide = 2200;

/**
 * File picker for receipts and certificates. Photos are shrunk in the browser before upload
 * (phone screenshots are often 3–6 MB), and the text stays sharp enough to be read automatically.
 */
export function DocumentInput({
  label,
  hint,
  required,
  onReady,
}: {
  label: string;
  hint: string;
  required?: boolean;
  onReady: (file: File | null, error: string) => void;
}) {
  const [preview, setPreview] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setName("");
    if (!picked) {
      onReady(null, "");
      return;
    }
    setBusy(true);
    const prepared = await prepareFile(picked);
    setBusy(false);
    if ("error" in prepared) {
      onReady(null, prepared.error);
      setName(picked.name);
      return;
    }
    setName(picked.name);
    if (prepared.file.type.startsWith("image/")) setPreview(URL.createObjectURL(prepared.file));
    onReady(prepared.file, "");
  }

  return (
    <label className="grid cursor-pointer gap-2 rounded-2xl border border-dashed border-navy/30 bg-[#f8fafc] p-4 text-sm font-semibold text-navy">
      <span>
        {label}
        {required ? <span className="text-green"> *</span> : <span className="font-normal text-muted"> (optional)</span>}
      </span>
      <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onChange} />
      {preview ? (
        <img src={preview} alt="" className="h-28 w-full rounded-xl bg-white object-contain" />
      ) : (
        <span className="grid h-28 place-items-center rounded-xl bg-white px-3 text-center font-normal leading-6 text-muted">
          {busy ? "Preparing the file…" : name && name.toLowerCase().endsWith(".pdf") ? `PDF: ${name}` : "Photo, screenshot or PDF"}
        </span>
      )}
      <span className="font-normal text-muted">{name && !busy ? name : hint}</span>
    </label>
  );
}

async function prepareFile(file: File): Promise<{ file: File } | { error: string }> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    return file.size <= maxBytes ? { file } : { error: "This PDF is over 1.5 MB. Upload a screenshot of it instead." };
  }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return { error: "Use a JPEG, PNG or WebP photo/screenshot, or a PDF." };
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1024 * 1024) {
      bitmap.close();
      return { file };
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file.size <= maxBytes ? { file } : { error: "This image is too large. Try a screenshot." };
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    for (const quality of [0.88, 0.78, 0.66]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= maxBytes) {
        return { file: new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) };
      }
    }
    return { error: "This image is too large even after shrinking. Try a cropped screenshot." };
  } catch {
    return file.size <= maxBytes ? { file } : { error: "This image could not be opened. Try a screenshot." };
  }
}
