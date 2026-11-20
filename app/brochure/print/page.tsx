import type { Metadata } from "next";
import { BrochureSheet } from "@/components/brochure-sheet";

export const metadata: Metadata = { title: "Brochure", robots: { index: false, follow: false } };

export default function BrochurePrintPage() {
  return (
    <div className="brochure-print">
      <BrochureSheet />
    </div>
  );
}
