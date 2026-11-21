import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "Inauguration" };

const seats = [
  { role: "Chief Guest", name: "To be announced" },
  { role: "Guest of Honour", name: "To be announced" },
];

export default function InaugurationPage() {
  return (
    <div className="pb-24 md:pb-0">
      <PageBanner
        kicker="Opening"
        title="The"
        accent="inauguration"
        lede="Details of the chief guest and guest of honour will be announced soon."
      />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2">
        {seats.map((seat) => (
          <article key={seat.role} className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green">{seat.role}</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl text-navy">{seat.name}</h2>
          </article>
        ))}
      </div>
    </div>
  );
}
