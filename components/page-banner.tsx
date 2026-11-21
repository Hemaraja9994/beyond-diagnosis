export function PageBanner({
  kicker,
  title,
  lede,
  accent,
}: {
  kicker: string;
  title: string;
  lede: string;
  accent?: string;
}) {
  return (
    <section className="hero-dark">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:pb-20 sm:pt-14">
        <p className="eyebrow">{kicker}</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold uppercase leading-[0.95] tracking-[0.01em] sm:text-6xl">
          {title}
          {accent ? (
            <>
              {" "}
              <span className="title-gradient">{accent}</span>
            </>
          ) : null}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">{lede}</p>
      </div>
    </section>
  );
}
