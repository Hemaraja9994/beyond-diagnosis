import Link from "next/link";
import { PassCard } from "@/components/pass-card";
import { audience, invitation, objectives, programme, sessions } from "@/lib/programme";

export default function HomePage() {
  return (
    <div className="pb-20 md:pb-0">
      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green">Zonal CRE · Online · English</p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] text-navy sm:text-6xl">{programme.title}</h1>
            <p className="mt-4 max-w-xl font-serif text-2xl leading-snug text-ink">{programme.subtitle}</p>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted">{programme.aim}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/registration" className="inline-flex min-h-12 items-center rounded-full bg-green px-5 font-semibold text-white">
                Register on this site
              </Link>
              <Link href="/join" className="inline-flex min-h-12 items-center rounded-full border border-navy px-5 font-semibold text-navy">
                Join on Webex
              </Link>
            </div>
          </div>
          <PassCard />
        </div>
      </section>

      <section className="border-y border-line bg-white" aria-label="At a glance">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            ["One day", programme.dateLabel],
            ["Four sessions", `From ${programme.start}`],
            ["Online", "Cisco Webex"],
            ["RCI CRE", programme.acknowledgement],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-4 py-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
              <dd className="mt-1 font-serif text-xl text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3">
        {[
          ["1", "Register here", "Your name, CRR number, and institution stay on this site. There is no separate form."],
          ["2", "Pay on Razorpay", "The fee is taken on the payment page. Come back and attach the payment reference to your registration."],
          ["3", "Join Webex", "One link opens the Cisco Webex session once the organising team publishes it."],
        ].map(([step, title, text]) => (
          <article key={step} className="rounded-3xl bg-card p-5 ring-1 ring-line">
            <p className="font-serif text-4xl text-green">{step}</p>
            <h2 className="mt-2 font-serif text-2xl text-navy">{title}</h2>
            <p className="mt-2 leading-7 text-muted">{text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl bg-navy p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mint">Invitation</p>
          <h2 className="mt-2 font-serif text-3xl">From the organising department</h2>
          <div className="mt-4 grid gap-4 leading-7 text-white/90">
            {invitation.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-6 text-sm">
            {programme.coordinator}
            <br />
            Programme Coordinator
            <br />
            {programme.organiser}
          </p>
        </article>
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-navy">The day</h2>
            <Link href="/programme" className="text-sm font-semibold text-green">
              Full programme
            </Link>
          </div>
          <ol className="timeline mt-6 grid gap-5">
            {sessions.map((session) => (
              <li key={session.time} className="grid grid-cols-[4.2rem_1fr] gap-4 sm:grid-cols-[5.5rem_1fr]">
                <p className="pt-1 text-sm font-semibold text-green">
                  {session.time}
                  <span className="block text-xs text-muted">{session.meridiem}</span>
                </p>
                <article className="rounded-3xl bg-card p-4 ring-1 ring-line">
                  <h3 className="font-serif text-xl leading-snug text-navy">{session.title}</h3>
                  <p className="mt-2 text-sm font-semibold">
                    {session.person} · CRR {session.crr}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">{session.relevance}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-mint">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-navy">Faculty</h2>
            <Link href="/faculty" className="text-sm font-semibold text-green">
              All resource persons
            </Link>
          </div>
          <ul className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {sessions.map((session) => (
              <li key={session.crr} className="w-64 shrink-0 rounded-3xl bg-card p-4 ring-1 ring-line">
                <div
                  className="grid h-16 w-16 place-items-center rounded-2xl bg-navy font-serif text-xl text-mint"
                  role="img"
                  aria-label={`Photograph of ${session.person} to follow`}
                >
                  {session.initials}
                </div>
                <p className="mt-4 font-serif text-xl text-navy">{session.person}</p>
                <p className="text-sm text-muted">CRR {session.crr}</p>
                <p className="mt-2 text-sm leading-6">{session.time} {session.meridiem} IST</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl text-navy">Why this day</h2>
          <ul className="mt-4 grid gap-3">
            {objectives.map((objective) => (
              <li key={objective} className="rounded-2xl bg-card px-4 py-3 leading-7 ring-1 ring-line">
                {objective}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-3xl text-navy">Who it is for</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {audience.map((item) => (
              <li key={item} className="rounded-full bg-navy px-4 py-2 text-sm text-white">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 leading-7 text-muted">
            The programme is acknowledged as CRE {programme.acknowledgement}, institute code {programme.instituteCode}. Credit hours are those recorded by the Rehabilitation Council of India for this acknowledgement. This site does not state a point value.
          </p>
          <Link href="/attend" className="mt-4 inline-flex font-semibold text-green">
            Single link for the RCI listing
          </Link>
        </div>
      </section>
    </div>
  );
}
