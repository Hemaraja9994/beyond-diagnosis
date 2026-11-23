import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { RciForm } from "@/components/rci-form";
import { rciApprovalLine } from "@/lib/programme";

export const metadata: Metadata = { title: "Add RCI confirmation" };

export default function RciConfirmationPage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="RCI CRE points"
        title="Add your"
        accent="RCI confirmation"
        lede="Claiming CRE points? After you register for this programme on the RCI website, RCI sends a confirmation mail. Take a screenshot of it and upload it here — it is matched to your registration."
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-5 text-sm text-muted">Current status of the programme with RCI: {rciApprovalLine}.</p>
        <RciForm />
      </div>
    </div>
  );
}
