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
        kicker="Attend"
        title="Register, or join the session"
        lede="New here? Register first and reserve your seat. Already registered? Join the Cisco Webex session on the day."
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-2">
        <article className="rounded-3xl bg-card p-6 ring-1 ring-line">
          <h2 className="font-serif text-2xl sm:text-3xl text-navy">Register</h2>
          <p className="mt-3 leading-7 text-muted">
            Fill in your details and CRR number, then complete payment on Razorpay to confirm your seat.
          </p>
          <Link
            href="/registration?from=rci"
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-green px-5 font-semibold text-white"
          >
            Register for the programme
          </Link>
        </article>
        <article className="rounded-3xl bg-card p-6 ring-1 ring-line">
          <h2 className="font-serif text-2xl sm:text-3xl text-navy">Cisco Webex</h2>
          <p className="mt-3 leading-7 text-muted">
            {meeting
              ? "The session link is ready. Join opens Cisco Webex."
              : "The Webex link will be shared here closer to the day. Registered participants will also receive it by email."}
          </p>
          <Link href="/join" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-navy px-5 font-semibold text-white">
            Join the session
          </Link>
        </article>
      </div>
      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-10">
        <h2 className="font-serif text-2xl text-navy">Share these links</h2>
        <CopyLink path="/attend" label="Register or join" />
        <CopyLink path="/registration?from=rci" label="Registration" />
        <CopyLink path="/join" label="Webex session" />
        <p className="text-sm leading-6 text-muted">
          Payment: {programme.paymentUrl}
        </p>
      </section>
    </div>
  );
}
