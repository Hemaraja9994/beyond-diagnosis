"use client";

import { useState } from "react";
import { programme } from "@/lib/programme";

/**
 * Download, share and keep the e-certificate. On phones "Share" opens the share sheet with the PDF itself,
 * so it can go to WhatsApp, Drive or Files; elsewhere it opens WhatsApp with the verification link.
 */
export function CertificateActions({ pdfUrl, fileName, verifyUrl, linkedInUrl }: { pdfUrl: string; fileName: string; verifyUrl: string; linkedInUrl: string }) {
  const [message, setMessage] = useState("");

  async function share() {
    setMessage("");
    const caption = `My certificate of participation — ${programme.title}: ${programme.subtitle} (Zonal CRE, Yenepoya). Verify: ${verifyUrl}`;
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("pdf");
      const file = new File([await response.blob()], fileName, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Certificate of Participation", text: caption });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer");
    setMessage("WhatsApp opened with your verification link. To send the PDF itself, download it and attach it.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setMessage("Verification link copied.");
    } catch {
      setMessage(verifyUrl);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-3">
        <a className="pill pill-solid" href={`${pdfUrl}&download=1`}>
          Download certificate (PDF)
        </a>
        <button className="pill pill-navy" type="button" onClick={share}>
          Share
        </button>
        <a className="pill pill-outline" href={linkedInUrl} target="_blank" rel="noopener noreferrer">
          Add to LinkedIn
        </a>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <a className="font-semibold text-green underline" href={pdfUrl} target="_blank" rel="noopener noreferrer">
          Open to view
        </a>
        <button className="font-semibold text-green underline" type="button" onClick={copy}>
          Copy verification link
        </button>
      </div>
      {message ? <p className="break-all text-sm text-muted">{message}</p> : null}
    </div>
  );
}
