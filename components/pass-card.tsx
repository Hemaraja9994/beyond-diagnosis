import { programme } from "@/lib/programme";

export function PassCard() {
  return (
    <article className="overflow-hidden rounded-2xl bg-navy text-white shadow-xl" aria-label="Programme pass">
      <div className="h-1.5 bg-flare" />
      <div className="px-6 py-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em]">
          <p className="text-flare">Pass</p>
          <p className="text-white/70">RCI CRE</p>
        </div>
        <p className="mt-4 font-serif text-4xl leading-[1.05]">
          Saturday,
          <br />
          19 December 2026
        </p>
        <div className="mt-6 grid grid-cols-2 border-t border-dashed border-white/25">
          <div className="border-r border-dashed border-white/25 py-4 pr-4">
            <p className="text-xs text-white/60">Starts</p>
            <p className="mt-1 text-lg font-semibold">{programme.start}</p>
          </div>
          <div className="py-4 pl-4">
            <p className="text-xs text-white/60">Venue</p>
            <p className="mt-1 text-lg font-semibold">Webex</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-white/25 py-4 text-sm">
          <p className="text-white/60">Institute code</p>
          <p className="text-lg font-semibold tracking-wide">{programme.instituteCode}</p>
        </div>
      </div>
    </article>
  );
}
