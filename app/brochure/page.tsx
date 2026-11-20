import type { Metadata } from "next";
import { BrochureActions } from "@/components/brochure-actions";
import { BrochureSheet } from "@/components/brochure-sheet";
import { HospitalMap } from "@/components/hospital-map";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "Brochure" };

export default function BrochurePage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Brochure"
        title="Take the flyer with you"
        lede="Download the one-page brochure, or send it on WhatsApp. The picture below is the same flyer."
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[auto_1fr] lg:items-start">
        <BrochureSheet />
        <div>
          <BrochureActions />
          <p className="mt-4 max-w-md leading-7 text-muted">
            The download is a PDF. WhatsApp opens with the brochure link ready to send.
          </p>
        </div>
      </div>
      <HospitalMap />
    </div>
  );
}
