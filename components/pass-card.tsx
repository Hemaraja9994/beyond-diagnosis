import { programme } from "@/lib/programme";

export function PassCard() {
  return (
    <div className="grid gap-4">
      <article className="datetab" aria-label="Programme date">
        <div className="datetab-block">
          <b>{programme.day}</b>
          <span>DEC</span>
        </div>
        <div className="datetab-info">
          <p className="day">Saturday · 2026</p>
          <p>10:00 AM IST onwards</p>
          <p>Online · Cisco Webex</p>
          <p>Zonal CRE · {programme.language}</p>
        </div>
      </article>
      <div className="flex items-center gap-3 text-sm leading-5 text-white/85">
        <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-white p-1.5">
          <img src="/brand/rci.png" alt="Rehabilitation Council of India" className="h-auto w-full" />
        </span>
        <span>
          <b className="block font-semibold text-white">Approved by RCI · {programme.rciHours} hours</b>
          F. No. {programme.rciFileNo} · Institute {programme.instituteCode}
        </span>
      </div>
    </div>
  );
}
