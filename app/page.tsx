import Link from "next/link";
import { BrochureActions } from "@/components/brochure-actions";
import { OfficialMarks } from "@/components/official-marks";
import { PassCard } from "@/components/pass-card";
import { Portrait } from "@/components/portrait";
import { departmentUrl } from "@/lib/department";
import { audience, committee, invitation, objectives, programme, sessionTickId, sessions } from "@/lib/programme";

export default function HomePage() {
  return (
    <div className="pb-20 md:pb-0">
      <section id="date">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green">Zonal CRE · Online · English</p>
            <h1 className="mt-3 max-w-[12ch] font-serif text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-navy sm:mt-4 sm:text-6xl sm:leading-[0.9] lg:text-7xl">
              {programme.title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink sm:mt-6 sm:text-lg">{programme.subtitle}</p>
            <p className="mt-4 max-w-xl leading-7 text-muted">{programme.aim}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link id="register" href="/registration" className="ticked inline-flex min-h-12 items-center rounded-lg bg-navy px-5 font-semibold text-white">
                Register on this site
              </Link>
              <Link id="webex" href="/join" className="ticked inline-flex min-h-12 items-center rounded-lg border border-navy bg-white px-5 font-semibold text-navy">
                Join on Webex
              </Link>
            </div>
          </div>
          <PassCard />
        </div>
      </section>

      <section id="brochure" className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[280px_1fr]">
          <div className="grid gap-3">
            <img
              src={programme.brochureImage}
              alt="Flyer page 1: the programme, with the four speakers and their topics."
              className="w-full rounded-3xl shadow-lg ring-1 ring-line"
            />
            <img
              src={programme.brochureImageBack}
              alt="Flyer page 2: the organising team, who it is for, and how to join."
              className="w-full rounded-3xl shadow-lg ring-1 ring-line"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">Brochure</p>
            <h2 className="mt-2 font-serif text-2xl text-navy sm:text-3xl">Download it, or send it on WhatsApp</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              Two pages. The first has the four sessions, the speakers, and the topics. The second has the organising team and how to join. The download is that flyer as a PDF.
            </p>
            <div className="mt-5">
              <BrochureActions />
            </div>
          </div>
        </div>
        <div className="mt-12 grid items-center gap-8 border-t border-line pt-12 lg:grid-cols-[280px_1fr]">
          <img
            src={programme.saveTheDateImage}
            alt="One-page flyer: Beyond the Diagnosis, the programme schedule, resource speakers, and the organising chairperson and secretaries."
            className="w-full rounded-3xl shadow-lg ring-1 ring-line"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">Also share</p>
            <h2 className="mt-2 font-serif text-2xl text-navy sm:text-3xl">Share this flyer</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              One page for WhatsApp. The title is up front, then the schedule with the resource speakers by name, and the organising chairperson and secretaries. Seats are limited. RCI CRE approval is still awaited. The programme flyer above stays as well.
            </p>
            <div className="mt-5">
              <BrochureActions kind="save" />
            </div>
          </div>
        </div>
      </section>

      <OfficialMarks />

      <section className="border-y border-line bg-white" aria-label="At a glance">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            ["One day", programme.dateLabel],
            ["Four sessions", `From ${programme.start}`],
            ["Online", "Cisco Webex"],
            ["RCI CRE", "Approval awaited"],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-4 py-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</dt>
              <dd className={`mt-1 font-serif text-xl text-navy ${label === "One day" ? "ticked" : ""}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-serif text-3xl sm:text-4xl">Three steps</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              ["1", "Register on this site"],
              ["2", "Pay on Razorpay"],
              ["3", "Join Webex"],
            ].map(([step, title]) => (
              <li key={step}>
                <p className="font-serif text-3xl text-flare sm:text-4xl">{step}</p>
                <p className="mt-3 border-t border-white/25 pt-3 font-semibold">{title}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-white/80">
            After you pay, add the payment id or upload the receipt screenshot on the registration page. It stays with your reference.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl bg-navy p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mint">Invitation</p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl">From the organising department</h2>
          <div className="mt-4 grid gap-4 leading-7 text-white/90">
            {invitation.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="mt-6 grid gap-3 text-sm">
            {committee.map((seat) => (
              <li key={seat.role}>
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-mint">{seat.role}</span>
                {seat.names.map((name) => (
                  <span key={name} className="block">
                    {name}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6">
            {programme.organiser}
            <br />
            {programme.hospital}
            <br />
            {programme.university}
          </p>
          <a className="mt-4 inline-flex font-semibold text-mint underline" href={departmentUrl}>
            College department page
          </a>
        </article>
        <div id="day">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl text-navy sm:text-3xl">The day</h2>
            <Link href="/programme" className="ticked text-sm font-semibold text-green">
              Full programme
            </Link>
          </div>
          <ol className="timeline mt-6 grid gap-5">
            {sessions.map((session) => (
              <li id={sessionTickId(session.time)} key={session.time} className="grid gap-2 sm:grid-cols-[5.5rem_1fr] sm:gap-4">
                <p className="text-sm font-semibold text-green sm:pt-1">
                  {session.time}
                  <span className="text-xs font-normal text-muted sm:block"> {session.meridiem}</span>
                </p>
                <article className="rounded-3xl bg-card p-4 ring-1 ring-line">
                  <h3 className="font-serif text-lg leading-snug text-navy sm:text-xl">{session.title}</h3>
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

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl text-navy sm:text-3xl">Faculty</h2>
            <Link href="/faculty" className="text-sm font-semibold text-green">
              All resource persons
            </Link>
          </div>
          <ul className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {sessions.map((session) => (
              <li key={session.crr} className="w-64 shrink-0 rounded-3xl bg-card p-4 ring-1 ring-line">
                <Portrait
                  name={session.person}
                  initials={session.initials}
                  photo={session.photo}
                  className="h-16 w-16 overflow-hidden rounded-2xl text-xl"
                />
                <p className="mt-4 font-serif text-xl text-navy">{session.person}</p>
                {session.designation ? <p className="mt-1 text-sm leading-6 text-muted">{session.designation}</p> : null}
                <p className="text-sm text-muted">CRR {session.crr}</p>
                <p className="mt-2 text-sm leading-6">{session.time} {session.meridiem} IST</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl text-navy sm:text-3xl">Why this day</h2>
          <ul className="mt-4 grid gap-3">
            {objectives.map((objective) => (
              <li key={objective} className="rounded-2xl bg-card px-4 py-3 leading-7 ring-1 ring-line">
                {objective}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-navy sm:text-3xl">Who it is for</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {audience.map((item) => (
              <li key={item} className="rounded-full bg-navy px-4 py-2 text-sm text-white">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 leading-7 text-muted">
            RCI CRE approval is awaited. The reference on file is {programme.acknowledgement}, institute code {programme.instituteCode}. Credit hours, if any, are those the council records once it approves the programme. This site does not state a point value.
          </p>
          <Link href="/attend" className="ticked mt-4 inline-flex font-semibold text-green">
            Single link for the RCI listing
          </Link>
        </div>
      </section>
    </div>
  );
}
