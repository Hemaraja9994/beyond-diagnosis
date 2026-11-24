import { creSteps, dayFormat, programme, rciRegisterLine } from "@/lib/programme";

/** How the day runs online (Webex + Slido) and how RCI CRE points are earned. */
export function CreSteps({ className = "" }: { className?: string }) {
  return (
    <section className={`card p-6 ${className}`} aria-labelledby="cre-steps">
      <h2 id="cre-steps" className="font-display text-2xl text-navy sm:text-3xl">
        How the day runs, and RCI CRE points
      </h2>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
        {dayFormat.map((line) => (
          <li key={line}>· {line}</li>
        ))}
      </ul>
      <ol className="mt-5 grid gap-3 sm:grid-cols-5">
        {creSteps.map((step, index) => (
          <li key={step.title} className="rounded-2xl bg-navy/5 p-3 text-sm leading-6">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-navy font-display text-white">{index + 1}</span>
            <p className="mt-2 font-semibold text-navy">{step.title}</p>
            <p className="text-muted">{step.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-2xl bg-gold/20 px-4 py-3 text-sm leading-6 text-navy">
        {rciRegisterLine}{" "}
        <a className="font-semibold underline" href={programme.rciCalendarUrl} target="_blank" rel="noopener noreferrer">
          Open the RCI CRE calendar
        </a>
      </p>
      <p className="mt-4 text-xs leading-5 text-muted">
        Steps 2, 4 and 5 are handled by the Rehabilitation Council of India. Participants who are not on the CRR, and students, attend and take part on
        Slido in the same way, without the RCI steps.
      </p>
    </section>
  );
}
