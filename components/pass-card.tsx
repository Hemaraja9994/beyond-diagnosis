import { programme } from "@/lib/programme";

export function PassCard() {
  return (
    <article className="pass" aria-label="Programme pass">
      <div className="flex items-center justify-between bg-navy px-5 py-4 text-mint">
        <p className="text-sm font-semibold tracking-[0.16em] uppercase">Yenepoya</p>
        <p className="text-sm font-semibold tracking-[0.16em] uppercase">CRE</p>
      </div>
      <div className="px-5 pb-5 pt-4">
      <p className="font-serif text-7xl leading-none text-navy">{programme.day}</p>
      <p className="font-serif text-2xl text-navy">{programme.month}</p>
      <p className="mt-1 text-sm text-muted">Saturday · {programme.mode} · from {programme.start}</p>
      <div className="pass-cut" />
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">Acknowledgement</dt>
          <dd className="font-semibold text-navy">{programme.acknowledgement}</dd>
        </div>
        <div>
          <dt className="text-muted">Institute</dt>
          <dd className="font-semibold text-navy">{programme.instituteCode}</dd>
        </div>
        <div>
          <dt className="text-muted">Language</dt>
          <dd className="font-semibold text-navy">{programme.language}</dd>
        </div>
        <div>
          <dt className="text-muted">Level</dt>
          <dd className="font-semibold text-navy">{programme.level}</dd>
        </div>
      </dl>
      </div>
    </article>
  );
}
