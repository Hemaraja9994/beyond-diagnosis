import type { Metadata } from "next";
import Link from "next/link";
import { SeatsBadge } from "@/components/seats-badge";
import { CopyLink } from "@/components/copy-link";
import { CreSteps } from "@/components/cre-steps";
import { PageBanner } from "@/components/page-banner";
import { programme } from "@/lib/programme";
import { publicMeetingUrl } from "@/lib/public-figures";

export const metadata: Metadata = { title: "Attend" };
export const dynamic = "force-dynamic";

export default async function AttendPage() {
  const meeting = await publicMeetingUrl();

  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Attend"
        title="Register, or"
        accent="join the session"
        lede="New here? Pay on Razorpay, then register with your receipt. Already registered? Join the Cisco Webex session on the day."
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-2">
        <article className="card p-6">
          <h2 className="font-display text-2xl sm:text-3xl text-navy">Register</h2>
          <p className="mt-3 leading-7 text-muted">
            Pay {programme.feeLabel} on Razorpay first, then fill in your details, CRR number and payment receipt to confirm your seat.
          </p>
          <SeatsBadge className="mt-4" />
          <Link
            href="/registration?from=rci"
            className="pill pill-solid mt-5"
          >
            Register for the programme
          </Link>
        </article>
        <article className="card p-6">
          <h2 className="font-display text-2xl sm:text-3xl text-navy">Cisco Webex</h2>
          <p className="mt-3 leading-7 text-muted">
            {meeting
              ? "The session link is ready. Join opens Cisco Webex."
              : "The Webex link will be shared here closer to the day. Registered participants will also receive it by email."}
          </p>
          <Link href="/join" className="pill pill-navy mt-5">
            Join the session
          </Link>
        </article>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8">
        <CreSteps />
      </div>
      <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-10">
        <h2 className="font-display text-2xl text-navy">Share these links</h2>
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
