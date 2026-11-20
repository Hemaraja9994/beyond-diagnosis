import { programme } from "@/lib/programme";

export function HospitalMap() {
  return (
    <section id="hospital" className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]" aria-label="Hospital location">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">Hands-on</p>
        <h2 className="mt-2 font-serif text-3xl text-navy">{programme.hospital}</h2>
        <p className="mt-3 leading-7 text-muted">
          The CRE day is online. This map is the hospital, for anyone coming in person for hands-on work at {programme.hospital}, Deralakatte.
        </p>
        <p className="mt-3 text-sm leading-6">{programme.address}</p>
        <a
          className="ticked mt-5 inline-flex min-h-12 items-center rounded-full bg-green px-5 font-semibold text-white"
          href={programme.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps
        </a>
      </div>
      <iframe
        title="Google Map of Yenepoya Medical College Hospital, Deralakatte, Mangaluru"
        src={programme.mapsEmbed}
        className="h-80 w-full rounded-3xl border border-line bg-white"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  );
}
