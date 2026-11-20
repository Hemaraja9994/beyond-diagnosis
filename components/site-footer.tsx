import Image from "next/image";
import Link from "next/link";
import { departmentUrl } from "@/lib/department";
import { committee, programme } from "@/lib/programme";

export function SiteFooter() {
  return (
    <footer className="no-print bg-deep pb-20 text-mint md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Image
            src="/brand/yenepoya-medical-college.png"
            alt="Yenepoya Medical College"
            width={474}
            height={257}
            className="h-20 w-auto bg-white p-2"
            unoptimized
          />
          <p className="mt-3 font-serif text-2xl text-white">Yenepoya</p>
          <p className="mt-2 text-sm leading-6">
            {programme.organiser}, {programme.university}, {programme.city}.
          </p>
          <p className="mt-3 text-sm leading-6">{programme.address}</p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Programme</p>
          <ul className="mt-3 grid gap-2 text-sm">
            <li>
              <Link href="/department">Department faculties</Link>
            </li>
            <li>
              <Link href="/install">Install on your phone</Link>
            </li>
            <li>
              <a href={departmentUrl}>College department page</a>
            </li>
            <li>
              <Link href="/programme">Schedule</Link>
            </li>
            <li>
              <Link href="/registration">Registration</Link>
            </li>
            <li>
              <Link href="/attend">RCI and Webex links</Link>
            </li>
            <li>
              <Link href="/general">Guidelines and downloads</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Desk</p>
          <ul className="mt-3 grid gap-3 text-sm leading-6">
            {committee.map((seat) => (
              <li key={seat.role}>
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white">{seat.role}</span>
                {seat.names.map((name) => (
                  <span key={name} className="block">
                    {name}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <a href={`mailto:${programme.email}`}>{programme.email}</a>
          </p>
          <p className="mt-3 text-sm">
            <Link href="/admin">Coordinator desk</Link>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-mint/80">
          © {new Date().getFullYear()} {programme.university}. Continuing Rehabilitation Education{" "}
          {programme.acknowledgement}.
        </p>
      </div>
    </footer>
  );
}
