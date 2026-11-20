import type { Metadata } from "next";
import Link from "next/link";
import { CopyLink } from "@/components/copy-link";
import { PageBanner } from "@/components/page-banner";
import { programme } from "@/lib/programme";
import { getMeetingUrl } from "@/lib/store";

export const metadata: Metadata = { title: "Attend" };
export const dynamic = "force-dynamic";

export default async function AttendPage() {
  const meeting = await getMeetingUrl();

  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="For the RCI listing"
        title="One link. Register, or enter the session."
        lede="If the Rehabilitation Council of India listing can carry a single address, use the Attend page. A participant chooses registration on this site or the Cisco Webex session."
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-2">
        <article className="rounded-3xl bg-card p-6 ring-1 ring-line">
          <h2 className="font-serif text-3xl text-navy">Register</h2>
          <p className="mt-3 leading-7 text-muted">
            Opens the registration form on this website, marked as an arrival from the RCI listing.
          </p>
          <Link
            href="/registration?from=rci"
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-green px-5 font-semibold text-white"
          >
            Register for the programme
          </Link>
        </article>
        <article className="rounded-3xl bg-card p-6 ring-1 ring-line">
          <h2 className="font-serif text-3xl text-navy">Cisco Webex</h2>
          <p className="mt-3 leading-7 text-muted">
            {meeting
              ? "The session link is ready. Join opens Cisco Webex."
              : "The organising team has not published the Webex link yet. Join will open it as soon as the coordinator desk saves a webex.com address."}
          </p>
          <Link href="/join" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-white">
            Join the session
          </Link>
        </article>
      </div>
      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-10">
        <h2 className="font-serif text-2xl text-navy">Addresses to give RCI</h2>
        <CopyLink path="/attend" label="Single link, if only one URL is allowed" />
        <CopyLink path="/registration?from=rci" label="Direct registration" />
        <CopyLink path="/join" label="Direct Webex join" />
        <p className="text-sm leading-6 text-muted">
          Payment, if it must be listed separately, remains {programme.paymentUrl}.
        </p>
      </section>
    </div>
  );
}
