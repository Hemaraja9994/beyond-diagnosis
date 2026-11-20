"use client";

import { programme } from "@/lib/programme";

export function BrochureActions() {
  function shareOnWhatsApp() {
    const file = `${window.location.origin}${programme.brochurePdf}`;
    const message = [
      `${programme.title}`,
      programme.subtitle,
      programme.dateLabel,
      "Online, on Cisco Webex, from 10:00 IST.",
      `Brochure: ${file}`,
      `Register: ${window.location.origin}/registration`,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a
        className="ticked inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-white"
        href={programme.brochurePdf}
        download="beyond-the-diagnosis-brochure.pdf"
      >
        Download the brochure
      </a>
      <button
        type="button"
        className="inline-flex min-h-12 items-center rounded-full bg-[#128C7E] px-5 font-semibold text-white"
        onClick={shareOnWhatsApp}
      >
        WhatsApp the brochure
      </button>
    </div>
  );
}
