"use client";

import { useState } from "react";
import { programme } from "@/lib/programme";

/**
 * Download the acknowledgement PDF, or share it. On phones the share sheet opens with the PDF attached,
 * so it can go to WhatsApp (including "Message yourself"). On computers it opens WhatsApp with the status link.
 */
export function AckActions({ reference, token }: { reference: string; token: string }) {
  const [message, setMessage] = useState("");
  const pdfUrl = `/api/acknowledgement/${reference}?t=${encodeURIComponent(token)}`;
  const statusPath = `/status/${reference}?t=${encodeURIComponent(token)}`;

  async function share() {
    setMessage("");
    const statusUrl = `${window.location.origin}${statusPath}`;
    const caption = `${programme.title} — registration ${reference}. Status: ${statusUrl}`;
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("pdf");
      const file = new File([await response.blob()], `Acknowledgement-${reference}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Acknowledgement ${reference}`, text: caption });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer");
    setMessage("WhatsApp opened with your status link. To send the PDF itself, download it and attach it in WhatsApp.");
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-3">
        <a className="pill pill-navy" href={`${pdfUrl}&download=1`}>
          Download acknowledgement (PDF)
        </a>
        <button className="pill pill-solid" type="button" onClick={share}>
          Share on WhatsApp
        </button>
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
