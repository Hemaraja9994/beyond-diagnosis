import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { UpdateForm } from "@/components/update-form";

export const metadata: Metadata = { title: "Update my registration" };

export default function UpdateRegistrationPage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Registration"
        title="Update"
        accent="my registration"
        lede="Registered already? Add your title, CRR number, payment receipt or certificate here — and the RCI confirmation mail once RCI opens registration for this programme."
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <UpdateForm />
      </div>
    </div>
  );
}
