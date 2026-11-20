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
      <figure className="overflow-hidden rounded-3xl bg-card shadow-lg ring-1 ring-line">
        <Image
          src="/brand/udid-sample.svg"
          alt="Sample drawing of a Unique Disability ID card. It is not a real card."
          width={640}
          height={400}
          className="h-52 w-full bg-navy object-cover"
          unoptimized
        />
        <figcaption className="p-4 text-sm leading-6 text-muted">
          Sample drawing of the Unique Disability ID. The sessions are about the certificate and the entitlements that follow it. This drawing is not a real card.
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
        <div aria-hidden="true">
          <span className="block h-2 bg-[#FF9933]" />
          <span className="block h-2 border-y border-[#e6e6e6] bg-white" />
          <span className="block h-2 bg-[#138808]" />
        </div>
        <div className="p-5">
          <p className="font-serif text-2xl leading-tight text-navy">Government of India</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Department of Empowerment of Persons with Disabilities. The Act, the rules, and the assessment guidelines are published there.
          </p>
          <figcaption className="mt-3 text-sm font-semibold text-green">
            <a href="https://depwd.gov.in/">Open the department site</a>
          </figcaption>
        </div>
      </figure>
    </section>
  );
}
