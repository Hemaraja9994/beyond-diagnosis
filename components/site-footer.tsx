import Image from "next/image";
import Link from "next/link";
import { MarkRail } from "@/components/mark-rail";
import { departmentUrl } from "@/lib/department";
import { committee, programme } from "@/lib/programme";

const links = [
  { href: "/programme", label: "Programme schedule" },
  { href: "/faculty", label: "Resource persons" },
  { href: "/registration", label: "Registration" },
  { href: "/registration/update", label: "Update my registration" },
  { href: "/registration/rci", label: "Add RCI confirmation" },
  { href: "/registration/status", label: "Status and acknowledgement" },
  { href: "/attend", label: "Register or join" },
  { href: "/general", label: "Guidelines and downloads" },
  { href: "/brochure", label: "Flyer and poster" },
  { href: "/department", label: "Host department" },
  { href: "/inauguration", label: "Inauguration" },
  { href: "/install", label: "Install on your phone" },
] as const;

export function SiteFooter() {
  return (
    <footer className="no-print mt-10 pb-20 md:pb-0">
      <div className="slant-top stripes-right bg-navy text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-10 pt-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">Zonal CRE · {programme.dateLabel}</p>
            <p className="mt-3 font-display text-3xl font-bold uppercase leading-none sm:text-5xl">
              Beyond <span className="script text-gold">the</span> <span className="title-gradient">Diagnosis</span>
            </p>
            <p className="mt-3 max-w-xl text-white/80">Disability Assessment, Certification and Entitlements under the RPwD Act, 2016.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/registration" className="pill pill-solid">
              Register today
            </Link>
            <Link href="/join" className="pill pill-ghost">
              Join on Webex
            </Link>
            <a href={programme.whatsappUrl} className="pill pill-ghost" target="_blank" rel="noopener noreferrer">
              WhatsApp group
            </a>
          </div>
        </div>

        <div className="border-t border-white/10">
          <MarkRail />
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 border-t border-white/10 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <span className="inline-flex rounded-2xl bg-white px-3 py-2">
              <Image
                src="/brand/yenepoya-medical-college.png"
                alt="Yenepoya Medical College"
                width={474}
                height={257}
                className="h-14 w-auto"
                unoptimized
              />
            </span>
            <p className="mt-4 font-display text-lg font-semibold uppercase tracking-[0.06em]">{programme.organiser}</p>
            <p className="mt-1 text-sm leading-6 text-white/75">
              {programme.hospital}
              <br />
              {programme.university}
              <br />
              {programme.address}
            </p>
            <a className="mt-3 inline-flex text-sm font-semibold text-gold hover:underline" href={departmentUrl}>
              College department page
            </a>
          </div>
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-gold">Explore</p>
            <ul className="mt-4 grid gap-2.5 text-sm text-white/85">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={programme.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                  Participants&apos; WhatsApp group
                </a>
              </li>
              <li>
                <a href={programme.brochurePdf} download className="hover:text-white hover:underline">
                  Download the flyer (PDF)
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-gold">Organising team</p>
            <ul className="mt-4 grid gap-3 text-sm leading-6">
              {committee.map((seat) => (
                <li key={seat.role}>
                  <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white/60">{seat.role}</span>
                  {seat.names.map((name) => (
                    <span key={name} className="block font-medium">
                      {name}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-white/85">
              <a className="hover:underline" href={`mailto:${programme.email}`}>
                {programme.email}
              </a>
              <br />
              <a className="hover:underline" href={`tel:+91${programme.departmentPhone}`}>
                +91 {programme.departmentPhone.slice(0, 5)} {programme.departmentPhone.slice(5)}
              </a>
            </p>
            <p className="mt-4 text-xs">
              <Link href="/admin" className="text-white/55 hover:text-white">
                Coordinator desk
              </Link>
            </p>
          </div>
        </div>

        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60">
            © {new Date().getFullYear()} {programme.university}. Continuing Rehabilitation Education · {programme.acknowledgement} ·
            Institute {programme.instituteCode} · RCI CRE approval awaited.
          </p>
        </div>
      </div>
    </footer>
  );
}
