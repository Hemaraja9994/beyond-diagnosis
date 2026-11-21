import type { Metadata } from "next";
import { BrochureActions } from "@/components/brochure-actions";
import { PageBanner } from "@/components/page-banner";
import { programme } from "@/lib/programme";

export const metadata: Metadata = { title: "Brochure" };

export default function BrochurePage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Brochure"
        title="Take the flyer with you"
        lede="Two pages: the speakers and their topics, then the organising team. Download the PDF, or send it on WhatsApp."
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[auto_1fr] lg:items-start">
        <div className="grid max-w-md gap-4">
          <img
            src={programme.brochureImage}
            alt="Flyer page 1: the programme, with the four speakers and their topics."
            className="w-full rounded-3xl shadow-lg ring-1 ring-line"
          />
          <img
            src={programme.brochureImageBack}
            alt="Flyer page 2: the organising team, who it is for, and how to join."
            className="w-full rounded-3xl shadow-lg ring-1 ring-line"
          />
        </div>
        <div>
          <BrochureActions />
          <p className="mt-4 max-w-md leading-7 text-muted">
            The download is a PDF. WhatsApp opens with the brochure link ready to send.
          </p>
        </div>
      </div>
    </div>
  );
}
