"use client";

import { programme } from "@/lib/programme";

type FlyerKind = "programme" | "save";

export function BrochureActions({ kind = "programme" }: { kind?: FlyerKind }) {
  switch (kind) {
    case "programme":
      return (
        <FlyerActions
          href={programme.brochurePdf}
          download="beyond-the-diagnosis-brochure.pdf"
          downloadLabel="Download the flyer"
          shareLabel="WhatsApp the flyer"
          message={() =>
            [
              programme.title,
              programme.subtitle,
              programme.dateLabel,
              "Zonal CRE · Online on Cisco Webex · from 10:00 AM IST",
              `Flyer: ${fileUrl(programme.brochurePdf)}`,
              `Register: ${originUrl("/registration")}`,
            ].join("\n")
          }
        />
      );
    case "save":
      return (
        <FlyerActions
          href={programme.saveTheDatePdf}
          download="beyond-the-diagnosis-poster.pdf"
          downloadLabel="Download the poster"
          shareLabel="WhatsApp the poster"
          message={() =>
            [
              programme.title,
              programme.dateLabel,
              "Zonal CRE · Online on Cisco Webex · from 10:00 AM IST",
              "Limited to 50 seats. RCI CRE approval awaited.",
              `Poster: ${fileUrl(programme.saveTheDateImage)}`,
              `Register: ${originUrl("/registration")}`,
            ].join("\n")
          }
        />
      );
    default: {
      const unknown: never = kind;
      return unknown;
    }
  }
}

function FlyerActions({
  href,
  download,
  downloadLabel,
  shareLabel,
  message,
}: {
  href: string;
  download: string;
  downloadLabel: string;
  shareLabel: string;
  message: () => string;
}) {
  function shareOnWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(message())}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a className="pill pill-navy" href={href} download={download}>
        {downloadLabel}
      </a>
      <button
        type="button"
        className="pill bg-[#128C7E] text-white"
        onClick={shareOnWhatsApp}
      >
        {shareLabel}
      </button>
    </div>
  );
}

function originUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function fileUrl(path: string): string {
  return originUrl(path.split("?")[0] ?? path);
}
