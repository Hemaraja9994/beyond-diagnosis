import Image from "next/image";
import { programme } from "@/lib/programme";

export function OfficialMarks() {
  return (
    <section id="marks" className="mx-auto max-w-6xl px-4 pb-6 pt-16" aria-label="Organisers and official references">
      <h2 className="section-title">
        Official <em>references</em>
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <figure className="flex flex-col items-center card p-5 text-center">
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
      <figure className="flex flex-col items-center card p-5 text-center">
        <Image
          src="/brand/rci.png"
          alt="Rehabilitation Council of India"
          width={740}
          height={668}
          className="h-28 w-auto"
          unoptimized
        />
        <figcaption className="mt-3 text-sm leading-6 text-muted">
          Rehabilitation Council of India. CRE approval applied for: {programme.acknowledgement}, institute {programme.instituteCode}.{" "}
          <a className="font-semibold text-green" href="https://rehabcouncil.nic.in/">
            Open the council site
          </a>
          .
        </figcaption>
      </figure>
      <figure className="card overflow-hidden">
        <Image
          src="/brand/udid-sample.svg"
          alt="Illustration of the Unique Disability ID card with blank fields."
          width={1000}
          height={580}
          className="h-52 w-full bg-white object-contain p-3"
          unoptimized
        />
        <figcaption className="p-4 text-sm leading-6 text-muted">
          The Unique Disability ID card, issued after disability certification under the RPwD Act, 2016 (illustration). The Act and guidelines are on the{" "}
          <a className="font-semibold text-green" href="https://depwd.gov.in/">
            DEPwD site
          </a>
          .
        </figcaption>
      </figure>
      <figure className="card overflow-hidden">
        <Image
          src="/brand/udid-card.png"
          alt="Unique Disability ID card issued by the Government of India. Personal details are obscured."
          width={484}
          height={240}
          className="h-52 w-full bg-white object-contain p-3"
        />
        <figcaption className="p-4 text-sm leading-6 text-muted">
          A sample UDID card with personal details hidden. Apply for and verify a card on the{" "}
          <a className="font-semibold text-green" href="https://swavlambancard.gov.in/">
            Swavlamban Card portal
          </a>
          .
        </figcaption>
      </figure>
      </div>
    </section>
  );
}
