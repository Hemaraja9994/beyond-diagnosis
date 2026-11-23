import type { Metadata } from "next";
import { LookupForm } from "@/components/lookup-form";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "Registration status" };

export default function LookupPage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Registration"
        title="Status and"
        accent="acknowledgement"
        lede="See whether your payment and RCI confirmation have been checked, and download or share your A4 acknowledgement."
      />
      <div className="mx-auto max-w-xl px-4 py-10">
        <LookupForm />
      </div>
    </div>
  );
}
