import Image from "next/image";
import { departmentUrl } from "@/lib/department";

const marks = [
  {
    href: departmentUrl,
    label: "Yenepoya Medical College",
    src: "/brand/yenepoya-medical-college.png",
    width: 474,
    height: 257,
  },
  {
    href: "https://rehabcouncil.nic.in/",
    label: "Rehabilitation Council of India",
    src: "/brand/rci.png",
    width: 740,
    height: 668,
  },
  {
    href: "/#marks",
    label: "Drawing of the Unique Disability ID card. Fields are blank.",
    src: "/brand/udid-sample.svg",
    width: 1000,
    height: 580,
  },
  {
    href: "https://swavlambancard.gov.in/",
    label: "Obscured Unique Disability ID card. Open the Swavlamban Card portal.",
    src: "/brand/udid-card.png",
    width: 484,
    height: 240,
  },
] as const;

function MarkSet({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="mark-set" aria-hidden={hidden || undefined}>
      {marks.map((mark) => (
        <a key={mark.src} className="mark-chip" href={mark.href} tabIndex={hidden ? -1 : undefined}>
          <Image src={mark.src} alt={hidden ? "" : mark.label} width={mark.width} height={mark.height} unoptimized />
        </a>
      ))}
      <a className="mark-chip mark-chip-dark" href="https://depwd.gov.in/" tabIndex={hidden ? -1 : undefined}>
        <Image src="/brand/india-emblem.png" alt={hidden ? "" : "State Emblem of India"} width={60} height={92} unoptimized />
        <Image src="/brand/swavlamban.png" alt={hidden ? "" : "Swavlamban"} width={104} height={94} unoptimized />
      </a>
    </div>
  );
}

export function MarkRail() {
  return (
    <div className="mark-rail" aria-label="RCI CRE status and official marks">
      <p className="approval-flag">RCI CRE approval awaited</p>
      <div className="mark-viewport">
        <div className="mark-track">
          <MarkSet />
          <MarkSet hidden />
        </div>
      </div>
    </div>
  );
}
