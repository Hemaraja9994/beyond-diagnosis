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
        title="Take a flyer with you"
        lede="Share the first flyer to block the date. The two-page programme flyer has the speakers, topics, and organising team."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
          <img
            src={programme.saveTheDateImage}
            alt="Block the date: Saturday 19 December 2026, an online workshop from 10:00 IST."
            className="w-full rounded-3xl shadow-lg ring-1 ring-line"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">First flyer</p>
            <h2 className="mt-2 font-serif text-2xl text-navy sm:text-3xl">Block the date</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              {programme.dateLabel}. Online, from {programme.start}. This is the one to send first.
            </p>
            <div className="mt-5">
              <BrochureActions kind="save" />
            </div>
          </div>
        </div>
        <div className="grid items-start gap-6 border-t border-line pt-10 lg:grid-cols-[auto_1fr]">
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">Programme flyer</p>
            <h2 className="mt-2 font-serif text-2xl text-navy sm:text-3xl">Speakers and the organising team</h2>
            <div className="mt-5">
              <BrochureActions />
            </div>
            <p className="mt-4 max-w-md leading-7 text-muted">
              The download is a PDF. WhatsApp opens with the brochure link ready to send.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
