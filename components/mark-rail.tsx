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
    label: "Unique Disability ID card illustration",
    src: "/brand/udid-sample.svg",
    width: 1000,
    height: 580,
  },
  {
    href: "https://swavlambancard.gov.in/",
    label: "Sample UDID card. Open the Swavlamban Card portal.",
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
      <a className="mark-chip" href="https://swavlambancard.gov.in/" tabIndex={hidden ? -1 : undefined}>
        <Image src="/brand/swavlamban.png" alt={hidden ? "" : "Swavlamban"} width={104} height={94} unoptimized />
      </a>
    </div>
  );
}

export function MarkRail() {
  return (
    <div className="mark-rail" aria-label="Official marks">
      <div className="mark-viewport">
        <div className="mark-track">
          <MarkSet />
          <MarkSet hidden />
        </div>
      </div>
    </div>
  );
}
