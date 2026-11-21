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
          downloadLabel="Download the PDF"
          shareLabel="WhatsApp the brochure"
          message={() =>
            [
              programme.title,
              programme.subtitle,
              programme.dateLabel,
              "Online, on Cisco Webex, from 10:00 IST.",
              `Brochure: ${fileUrl(programme.brochurePdf)}`,
              `Register: ${originUrl("/registration")}`,
            ].join("\n")
          }
        />
      );
    case "save":
      return (
        <FlyerActions
          href={programme.saveTheDatePdf}
          download="block-the-date.pdf"
          downloadLabel="Download the first flyer"
          shareLabel="WhatsApp this flyer"
          message={() =>
            [
              programme.title,
              programme.dateLabel,
              "Online, Cisco Webex, from 10:00 IST. Zonal. English.",
              "Resource speakers, organising chairperson and organising secretaries.",
              "Limited number of seats. RCI CRE approval awaited.",
              `Flyer: ${fileUrl(programme.saveTheDateImage)}`,
              originUrl("/"),
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
      <a className="ticked inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-white" href={href} download={download}>
        {downloadLabel}
      </a>
      <button
        type="button"
        className="inline-flex min-h-12 items-center rounded-full bg-[#128C7E] px-5 font-semibold text-white"
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
