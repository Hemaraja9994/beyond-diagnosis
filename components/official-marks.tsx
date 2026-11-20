import Image from "next/image";
import { programme } from "@/lib/programme";

export function OfficialMarks() {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 xl:grid-cols-4" aria-label="Organisers and official references">
      <figure className="flex flex-col items-center rounded-3xl bg-card/90 p-5 text-center ring-1 ring-line backdrop-blur">
        <Image
          src="/brand/yenepoya-medical-college.png"
          alt="Yenepoya Medical College"
          width={474}
          height={257}
          className="h-28 w-auto"
          unoptimized
        />
        <figcaption className="mt-3 text-sm leading-6 text-muted">
          Yenepoya Medical College, a constituent college of {programme.university}.
        </figcaption>
      </figure>
      <figure className="flex flex-col items-center rounded-3xl bg-card/90 p-5 text-center ring-1 ring-line backdrop-blur">
        <Image
          src="/brand/rci.png"
          alt="Rehabilitation Council of India"
          width={740}
          height={668}
          className="h-28 w-auto"
          unoptimized
        />
        <figcaption className="mt-3 text-sm leading-6 text-muted">
          Rehabilitation Council of India. This CRE is acknowledged as {programme.acknowledgement}, institute {programme.instituteCode}.{" "}
          <a className="font-semibold text-green" href="https://rehabcouncil.nic.in/">
            Open the council site
          </a>
          .
        </figcaption>
      </figure>
      <figure className="overflow-hidden rounded-3xl bg-card shadow-lg ring-1 ring-line">
        <Image
          src="/brand/udid-sample.svg"
          alt="Graphical recreation of the original Unique Disability ID card. Personal fields are blank. It is not a real card."
          width={1000}
          height={580}
          className="h-52 w-full bg-white object-contain p-3"
          unoptimized
        />
        <figcaption className="p-4 text-sm leading-6 text-muted">
          A drawing of the original Unique Disability ID card. Names, numbers, and the photograph are blank. This is not a real card.
        </figcaption>
      </figure>
      <figure className="overflow-hidden rounded-3xl bg-card shadow-lg ring-1 ring-line">
        <Image
          src="/brand/udid-card.png"
          alt="Unique Disability ID card issued by the Government of India. Personal details are obscured."
          width={484}
          height={240}
          className="h-52 w-full bg-white object-contain p-3"
        />
        <figcaption className="p-4 text-sm leading-6 text-muted">
          A real Unique Disability ID card. Names, numbers, and the photograph are hidden. Apply and verify a card on the{" "}
          <a className="font-semibold text-green" href="https://swavlambancard.gov.in/">
            Swavlamban Card portal
          </a>
          . This is not a participant’s card.
        </figcaption>
      </figure>
      <figure className="overflow-hidden rounded-3xl bg-card ring-1 ring-line">
        <div className="flex items-end justify-center gap-5 bg-deep px-4 py-5">
          <Image
            src="/brand/india-emblem.png"
            alt="State Emblem of India"
            width={60}
            height={92}
            className="h-20 w-auto"
            unoptimized
          />
          <Image
            src="/brand/swavlamban.png"
            alt="Swavlamban"
            width={104}
            height={94}
            className="h-20 w-auto"
            unoptimized
          />
        </div>
        <figcaption className="p-4 text-sm leading-6 text-muted">
          State Emblem of India and Swavlamban, the marks that sit with the Unique Disability ID. The Act and the assessment guidelines are on the{" "}
          <a className="font-semibold text-green" href="https://depwd.gov.in/">
            Department of Empowerment of Persons with Disabilities
          </a>{" "}
          site.
        </figcaption>
      </figure>
    </section>
  );
}
