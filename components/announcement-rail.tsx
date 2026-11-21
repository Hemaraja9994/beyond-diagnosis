import Link from "next/link";
import { programme, sessionTickId, sessions } from "@/lib/programme";

const announcements = [
  { href: "/attend", label: "RCI CRE approval awaited", alert: true },
  { href: "/#date", label: programme.dateLabel, alert: false },
  { href: "/programme", label: `From ${programme.start} · Cisco Webex · ${programme.language}`, alert: false },
  ...sessions.map((session) => ({
    href: `/programme#${sessionTickId(session.time)}`,
    label: `${session.time} ${session.meridiem} · ${session.person}`,
    alert: false,
  })),
  { href: "/registration", label: "Register on this site", alert: false },
  { href: "/join", label: "Join on Webex", alert: false },
  { href: "/brochure", label: "Download the brochure", alert: false },
  { href: "/attend", label: `Institute ${programme.instituteCode} · ${programme.acknowledgement}`, alert: false },
] as const;

function AnnouncementSet({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="announce-set" aria-hidden={hidden || undefined}>
      {announcements.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          className={item.alert ? "announce-chip announce-alert" : "announce-chip"}
          tabIndex={hidden ? -1 : undefined}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function AnnouncementRail() {
  return (
    <div className="announce-rail" aria-label="Dates, links, and RCI CRE status">
      <div className="announce-viewport">
        <div className="announce-track">
          <AnnouncementSet />
          <AnnouncementSet hidden />
        </div>
      </div>
    </div>
  );
}
