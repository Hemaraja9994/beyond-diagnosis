import Link from "next/link";

const links = [
  { href: "/registration/rci", title: "Add RCI confirmation", text: "Upload RCI's confirmation mail for CRE points" },
  { href: "/registration/status", title: "Status & acknowledgement", text: "Check payment, download or share the PDF" },
  { href: "/registration/update", title: "Update my registration", text: "Add a receipt, CRR or title later" },
] as const;

/** "Already registered?" shortcuts, as a tidy list instead of a stack of buttons. */
export function RegistrationLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Already registered" className={`rounded-2xl bg-white ring-1 ring-line ${className}`}>
      <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Already registered?</p>
      <ul className="mt-1 divide-y divide-line">
        {links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group flex items-center gap-3 px-4 py-3 hover:bg-navy/5">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-navy group-hover:underline">{item.title}</span>
                <span className="block text-xs leading-5 text-muted">{item.text}</span>
              </span>
              <span aria-hidden="true" className="text-lg text-green">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
