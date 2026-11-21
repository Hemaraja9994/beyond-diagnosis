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
        title="Inauguration"
        lede="The chief guest and guest of honour will be named here when the department confirms them."
      />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2">
        {seats.map((seat) => (
          <article key={seat.role} className="rounded-3xl bg-card p-6 ring-1 ring-line">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green">{seat.role}</p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-navy">{seat.name}</h2>
          </article>
        ))}
      </div>
    </div>
  );
}
