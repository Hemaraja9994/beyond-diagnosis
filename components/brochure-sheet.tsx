import { committee, programme, sessions } from "@/lib/programme";

export function BrochureSheet() {
  return (
    <article className="brochure-sheet">
      <header className="brochure-head">
        <img src="/brand/yenepoya-medical-college.png" alt="Yenepoya Medical College" />
        <div>
          <p>Department of Audiology and Speech Language Pathology</p>
          <p>{programme.hospital}</p>
          <p>{programme.university}</p>
        </div>
        <img className="brochure-rci" src="/brand/rci.png" alt="Rehabilitation Council of India" />
      </header>
      <div className="brochure-gov">
        <img src="/brand/india-emblem.png" alt="State Emblem of India" />
        <p>
          <strong>Government of India</strong>
          Unique Disability ID · Swavlamban
        </p>
        <img src="/brand/swavlamban.png" alt="Swavlamban" />
      </div>
      <p className="brochure-kicker">Zonal CRE · Online · English · RCI CRE approval awaited</p>
      <h1>{programme.title}</h1>
      <p className="brochure-sub">{programme.subtitle}</p>
      <dl className="brochure-facts">
        <div>
          <dt>Date</dt>
          <dd>Saturday, 19 December 2026</dd>
        </div>
        <div>
          <dt>From</dt>
          <dd>10:00 IST · Cisco Webex</dd>
        </div>
        <div>
          <dt>Institute</dt>
          <dd>{programme.instituteCode}</dd>
        </div>
      </dl>
      <ol className="brochure-sessions">
        {sessions.map((session) => (
          <li key={session.crr}>
            <span>
              {session.time} {session.meridiem}
            </span>
            <strong>{session.title}</strong>
            <em>{session.person}</em>
          </li>
        ))}
      </ol>
      <footer className="brochure-foot">
        <div>
          {committee.map((seat) => (
            <p key={seat.role}>
              <span>{seat.role}</span>
              {seat.names.join(" · ")}
            </p>
          ))}
        </div>
        <div>
          <p>{programme.hospital}</p>
          <p>{programme.address}</p>
          <p>
            {programme.email} · {programme.departmentPhone}
          </p>
          <p>yenepoya-cre.vercel.app</p>
        </div>
      </footer>
    </article>
  );
}
