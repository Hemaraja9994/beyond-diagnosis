import Link from "next/link";
import { SeatsBadge } from "@/components/seats-badge";
import { BrochureActions } from "@/components/brochure-actions";
import { Face } from "@/components/face";
import { OfficialMarks } from "@/components/official-marks";
import { PassCard } from "@/components/pass-card";
import { departmentUrl } from "@/lib/department";
import { audience, invitation, objectives, onlineProgramme, programme, sessionTickId, sessions, speakers } from "@/lib/programme";

const team = [
  { role: "Organising chairperson", name: "Dr. Shwetha Prabhu", detail: "Professor, Department of Audiology and Speech Language Pathology, Yenepoya University", photo: "/department/shwetha-prabhu.jpg", initials: "SP" },
  { role: "Organising secretary", name: "Ms. Swathi Chinnasamy", detail: "Assistant Professor, Department of Audiology and Speech Language Pathology, Yenepoya University", photo: "/faculty/swathi-c.jpg", initials: "SC" },
  { role: "Organising secretary", name: "Ms. Rachana R Uchil", detail: "Clinical Supervisor, Department of Audiology and Speech Language Pathology, Yenepoya University", photo: "/department/rachana-uchil.jpg", initials: "RU" },
] as const;

const stats = [
  ["1", "Day"],
  ["4", "Sessions"],
  ["4", "Resource persons"],
  ["21", "Disabilities covered"],
] as const;

export default function HomePage() {
  return (
    <div className="pb-6">
      {/* Hero */}
      <section id="date" className="hero-dark">
        <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 pb-12 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-16">
          <div>
            <p className="eyebrow">Zonal CRE Programme · Online · English</p>
            <h1 className="mt-5 font-display font-bold uppercase leading-[0.86]">
              <span className="block text-5xl text-white sm:text-7xl">
                Beyond <span className="script text-gold">the</span>
              </span>
              <span className="title-gradient block text-[4.2rem] sm:text-[7rem] lg:text-[7.6rem]">Diagnosis</span>
            </h1>
            <p className="mt-6 max-w-2xl border-l-4 border-gold pl-4 text-2xl font-semibold leading-tight text-white sm:text-[2.1rem]">
              Disability Assessment, <span className="text-gold">Certification</span> and Entitlements under the RPwD Act, 2016
            </p>
            <p className="mt-3 max-w-xl leading-7 text-white/70">{programme.aim}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link id="register" href={programme.registrationClosed ? "/registration/status" : "/registration"} className="pill pill-solid">
                {programme.registrationClosed ? "Registration closed · my status" : "Register today"}
              </Link>
              <Link href={onlineProgramme.path} className="pill pill-ghost">
                Participant registration (no CRE)
              </Link>
              <Link id="webex" href="/join" className="pill pill-ghost">
                Join on Webex
              </Link>
            </div>
          </div>
          <PassCard />
        </div>
        <div className="border-t border-white/10">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:grid-cols-4">
            {stats.map(([value, label], index) => (
              <div key={label} className={`py-5 ${index ? "sm:border-l sm:border-white/10 sm:pl-6" : ""}`}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="font-display text-4xl font-bold text-gold sm:text-5xl">{value}</span>
                  <span className="ml-2 font-display text-sm uppercase tracking-[0.14em] text-white/75">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Speakers */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="section-title flex-1">
            Resource <em>speakers</em>
          </h2>
          <Link href="/faculty" className="hidden font-display text-sm font-semibold uppercase tracking-[0.1em] text-green sm:inline">
            All profiles →
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {speakers.map((speaker) => (
            <li key={speaker.crr} className="text-center">
              <Face
                name={speaker.person}
                initials={speaker.initials}
                photo={speaker.photo}
                className="mx-auto h-28 w-28 sm:h-36 sm:w-36"
              />
              <h3 className="mt-5 text-lg font-bold leading-snug text-navy">{speaker.person}</h3>
              <p className="mt-1 text-sm leading-5 text-muted">{speaker.designation}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Schedule */}
      <section id="day" className="mx-auto max-w-6xl px-4 pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="section-title flex-1">
            Programme <em>schedule</em>
          </h2>
          <Link href="/programme" className="hidden font-display text-sm font-semibold uppercase tracking-[0.1em] text-green sm:inline">
            Full programme →
          </Link>
        </div>
        <ol className="mt-8 grid gap-4">
          {sessions.map((session, index) => (
            <li id={sessionTickId(session.time)} key={session.time} className={`session-card accent-${index + 1}`}>
              <div className="session-tab">
                <b>{session.time}</b>
                <span>{session.meridiem}</span>
                <small>Session {index + 1}</small>
              </div>
              <div className="session-body">
                <h3 className="text-lg font-bold leading-snug text-ink sm:text-xl">{session.title}</h3>
                <p className="speaker-name text-accent mt-2 text-sm sm:text-base">
                  {session.person}
                  <span className="ml-2 font-sans text-xs font-normal normal-case tracking-normal text-muted">CRR {session.crr}</span>
                </p>
                <p className="mt-2 text-sm leading-6 text-muted sm:text-[0.95rem]">{session.relevance}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Steps */}
      <section className="hero-dark mt-16">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="section-title on-dark">
            Three steps to <em>your seat</em>
          </h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              ["1", "Pay on Razorpay", `Pay ${programme.feeLabel} — the same fee for everyone — and keep the receipt and Payment ID.`],
              ["2", "Register", "Fill in your details, CRR number (if claiming CRE points) and attach the receipt. Your acknowledgement PDF is ready at once."],
              ["3", "Join", "Join the participants' WhatsApp group, and the Cisco Webex session on the day. Slido runs inside Webex."],
            ].map(([step, title, body]) => (
              <li key={step} className="rounded-3xl border border-white/12 bg-white/5 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-flare to-brass font-display text-2xl font-bold">
                  {step}
                </span>
                <p className="mt-4 font-display text-xl font-semibold uppercase tracking-[0.06em]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-white/75">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={programme.registrationClosed ? "/registration/status" : "/registration"} className="pill pill-solid">
              {programme.registrationClosed ? "Registration closed · my status" : "Start registration"}
            </Link>
            <SeatsBadge tone="dark" />
          </div>
        </div>
      </section>

      {/* Flyer + poster */}
      <section id="brochure" className="mx-auto max-w-6xl px-4 pt-16">
        <h2 className="section-title">
          Flyer and <em>poster</em>
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="card grid gap-5 p-5 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-center">
            <div className="grid grid-cols-2 gap-2">
              <img src={programme.brochureImage} alt="Flyer page 1: the four sessions and speakers." className="w-full rounded-xl ring-1 ring-line" />
              <img src={programme.brochureImageBack} alt="Flyer page 2: the organising team and how to register." className="w-full rounded-xl ring-1 ring-line" />
            </div>
            <div>
              <p className="eyebrow eyebrow-light">Two-page flyer</p>
              <h3 className="mt-2 font-display text-2xl font-semibold uppercase text-navy">Programme in full</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Every session, speaker and topic, then the organising team and how to join.</p>
              <div className="mt-4">
                <BrochureActions />
              </div>
            </div>
          </article>
          <article className="card grid gap-5 p-5 sm:grid-cols-[minmax(0,170px)_1fr] sm:items-center">
            <img
              src={programme.saveTheDateImage}
              alt="Poster: Beyond the Diagnosis, 19 December 2026, with the resource speakers, schedule and organising team."
              className="w-full rounded-xl ring-1 ring-line"
            />
            <div>
              <p className="eyebrow eyebrow-light">One-page poster</p>
              <h3 className="mt-2 font-display text-2xl font-semibold uppercase text-navy">Spread the word</h3>
              <p className="mt-2 text-sm leading-6 text-muted">The whole day on one page, sized for WhatsApp, email and notice boards.</p>
              <div className="mt-4">
                <BrochureActions kind="save" />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Why + who */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pt-16 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="info-card accent-1">
          <h2>Why attend</h2>
          <div>
            <ul className="grid gap-3">
              {objectives.map((objective, index) => (
                <li key={objective} className="flex gap-3 leading-7">
                  <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-accent font-display text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        </article>
        <div className="grid gap-6">
          <article className="info-card accent-2">
            <h2>Who should attend</h2>
            <div>
              <ul className="flex flex-wrap gap-2">
                {audience.map((item) => (
                  <li key={item} className="tag">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
          <article className="info-card accent-4">
            <h2>Certification</h2>
            <div>
              <p className="text-sm leading-6 text-muted">
                Approved by the Rehabilitation Council of India as a {programme.level.toLowerCase()}-level CRE programme of {programme.rciHours} hours
                (F. No. {programme.rciFileNo}, institute code {programme.instituteCode}), with a maximum intake of {programme.rciIntake}. It is
                listed on the{" "}
                <a className="font-semibold text-green underline" href={programme.rciCalendarUrl} target="_blank" rel="noopener noreferrer">
                  RCI CRE calendar
                </a>{" "}
                for 19 December 2026.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Invitation + team */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <h2 className="section-title">
          Organising <em>team</em>
        </h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <article className="hero-dark rounded-[1.75rem] p-7">
            <p className="eyebrow">Invitation</p>
            <div className="mt-4 grid gap-4 leading-7 text-white/88">
              {invitation.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-white/70">
              {programme.organiser}
              <br />
              {programme.hospital} · {programme.university}
            </p>
            <a className="mt-4 inline-flex font-semibold text-gold hover:underline" href={departmentUrl}>
              College department page
            </a>
          </article>
          <ul className="grid gap-8 sm:grid-cols-3">
            {team.map((person, index) => (
              <li key={person.name} className="text-center">
                <Face name={person.name} initials={person.initials} photo={person.photo} accent={index + 1} className="mx-auto h-32 w-32" />
                <span className="pill pill-solid pill-sm mt-5">{person.role}</span>
                <h3 className="mt-3 text-lg font-bold text-navy">{person.name}</h3>
                <p className="mt-1 text-sm leading-5 text-muted">{person.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <OfficialMarks />
    </div>
  );
}
