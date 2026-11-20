import Image from "next/image";
import { programme } from "@/lib/programme";

export function OfficialMarks() {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3" aria-label="Organisers and official references">
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
      <figure className="overflow-hidden rounded-3xl bg-navy p-5 text-mint shadow-lg ring-1 ring-navy">
        <div className="flex gap-3">
          <div className="grid h-20 w-16 shrink-0 place-items-center rounded-xl bg-mint text-xs font-semibold text-navy">Photo</div>
          <div>
            <p className="font-serif text-3xl text-white">UDID</p>
            <p className="text-sm">Unique Disability ID</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          <span className="h-2 w-3/4 rounded-full bg-white/70" />
          <span className="h-2 w-1/2 rounded-full bg-white/40" />
          <span className="h-2 w-2/3 rounded-full bg-flare/90" />
        </div>
        <figcaption className="mt-4 text-sm leading-6 text-mint">
          The sessions are about the certificate and the entitlements that follow it. This drawing is not a real card.
        </figcaption>
      </figure>
      <figure className="overflow-hidden rounded-3xl bg-card ring-1 ring-line">
        <div className="grid grid-cols-3" aria-hidden="true">
          <span className="h-2 bg-[#ff7a1a]" />
          <span className="h-2 bg-white" />
          <span className="h-2 bg-[#138808]" />
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
