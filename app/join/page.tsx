import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageBanner } from "@/components/page-banner";
import { publicMeetingUrl } from "@/lib/public-figures";

export const metadata: Metadata = { title: "Join" };
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const meeting = await publicMeetingUrl();
  if (meeting) redirect(meeting);

  return (
    <div className="pb-24 md:pb-0">
      <PageBanner
        kicker="Cisco Webex"
        title="Session link"
        accent="coming soon"
        lede="This page will open the Cisco Webex session once the link is published. Questions and polls run on Slido inside Webex. Register now to reserve your seat, and the link will also reach you by email."
      />
      <div className="mx-auto flex max-w-3xl flex-wrap gap-3 px-4 py-10">
        <Link href="/registration?from=join" className="pill pill-solid">
          Register
        </Link>
        <Link href="/contact" className="pill pill-outline">
          Ask the coordinator
        </Link>
      </div>
    </div>
  );
}
