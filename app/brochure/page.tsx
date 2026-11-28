import type { Metadata } from "next";
import { BrochureActions } from "@/components/brochure-actions";
import { PageBanner } from "@/components/page-banner";
import { onlineProgramme, programme } from "@/lib/programme";

export const metadata: Metadata = { title: "Brochure" };

export default function BrochurePage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Brochure"
        title="Flyer and"
        accent="poster"
        lede="Download the programme flyer or the one-page poster, and share them with colleagues and students."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[auto_1fr]">
          <div className="grid max-w-xl grid-cols-2 gap-4">
            <img
              src={programme.brochureImage}
              alt="Flyer page 1: the programme, with the four speakers and their topics."
              className="w-full rounded-2xl shadow-lg ring-1 ring-line"
            />
            <img
              src={programme.brochureImageBack}
              alt="Flyer page 2: the organising team, who it is for, and how to join."
              className="w-full rounded-2xl shadow-lg ring-1 ring-line"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">Programme flyer</p>
            <h2 className="mt-2 font-display text-2xl text-navy sm:text-3xl">Speakers and the organising team</h2>
            <p className="mt-3 max-w-md leading-7 text-muted">
              A two-page PDF with every session, speaker and topic, followed by the organising team and how to join.
            </p>
            <div className="mt-5">
              <BrochureActions />
            </div>
          </div>
        </div>
        <div id="online" className="grid scroll-mt-32 items-start gap-6 border-t border-line pt-10 lg:grid-cols-[auto_1fr]">
          <div className="grid max-w-xl grid-cols-2 gap-4">
            <img
              src={onlineProgramme.brochureImage}
              alt="Online programme brochure page 1: the four sessions and the registration link with a QR code."
              className="w-full rounded-2xl shadow-lg ring-1 ring-line"
            />
            <img
              src={onlineProgramme.brochureImageBack}
              alt="Online programme brochure page 2: who can join, how to register, contact and certificate."
              className="w-full rounded-2xl shadow-lg ring-1 ring-line"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0e6157]">Non-RCI CRE registration · {onlineProgramme.name}</p>
            <h2 className="mt-2 font-display text-2xl text-navy sm:text-3xl">For students, allied professionals and parents</h2>
            <p className="mt-3 max-w-md leading-7 text-muted">
              A separate two-page brochure with the registration link and QR code, for everyone not claiming RCI CRE points. Registration is open until{" "}
              {onlineProgramme.closesLabel}. {onlineProgramme.noCreLine}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a className="pill pill-solid" href={onlineProgramme.brochurePdf} target="_blank" rel="noopener noreferrer">
                Download the non-RCI brochure (PDF)
              </a>
              <a className="pill pill-navy" href={onlineProgramme.path}>
                Non-RCI CRE registration
              </a>
            </div>
          </div>
        </div>
        <div className="grid items-start gap-6 border-t border-line pt-10 lg:grid-cols-[minmax(0,320px)_1fr]">
          <img
            src={programme.saveTheDateImage}
            alt="Poster: Beyond the Diagnosis, 19 December 2026, with the resource speakers, programme schedule and organising team."
            className="w-full rounded-2xl shadow-lg ring-1 ring-line"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">Poster</p>
            <h2 className="mt-2 font-display text-2xl text-navy sm:text-3xl">Spread the word</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              {programme.dateLabel}, from {programme.start}. The whole day on a single page.
            </p>
            <div className="mt-5">
              <BrochureActions kind="save" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
