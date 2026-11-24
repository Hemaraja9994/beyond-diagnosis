import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { RciForm } from "@/components/rci-form";
import { programme, rciApprovalLine } from "@/lib/programme";

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
        <ol className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Register on the RCI website", "This programme is on the RCI CRE calendar for 19 December 2026. Register for it there with your CRR login."],
            ["Screenshot the mail", "RCI sends a confirmation mail. Take a screenshot where your name or CRR number shows."],
            ["Upload it here", "Use your YDU- reference and email. It is matched to your registration automatically."],
          ].map(([title, text], index) => (
            <li key={title} className="card p-4 text-sm leading-6">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-navy font-display text-white">{index + 1}</span>
              <p className="mt-2 font-semibold text-navy">{title}</p>
              <p className="text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <p className="mb-5 text-sm text-muted">
          Current status of the programme with RCI: {rciApprovalLine}.{" "}
          <a className="font-semibold text-green underline" href={programme.rciCalendarUrl} target="_blank" rel="noopener noreferrer">
            Open the RCI CRE calendar
          </a>
          .
        </p>
        <RciForm />
      </div>
    </div>
  );
}
