export function PageBanner({ kicker, title, lede }: { kicker: string; title: string; lede: string }) {
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-flare">{kicker}</p>
        <h1 className="mt-2 max-w-4xl font-serif text-3xl leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-white/90 sm:mt-4 sm:text-lg sm:leading-8">{lede}</p>
      </div>
    </section>
  );
}
