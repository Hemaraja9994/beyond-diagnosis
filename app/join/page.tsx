import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageBanner } from "@/components/page-banner";
import { getMeetingUrl } from "@/lib/store";

export const metadata: Metadata = { title: "Join" };
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const meeting = await getMeetingUrl();
  if (meeting) redirect(meeting);

  return (
    <div className="pb-24 md:pb-0">
      <PageBanner
        kicker="Cisco Webex"
        title="The session link is not published yet"
        lede="When the coordinator saves a Cisco Webex address, this page opens it directly. Until then, register and write to the conference email if you need the link."
      />
      <div className="mx-auto flex max-w-3xl flex-wrap gap-3 px-4 py-10">
        <Link href="/registration?from=join" className="inline-flex min-h-12 items-center rounded-full bg-green px-5 font-semibold text-white">
          Register
        </Link>
        <Link href="/contact" className="inline-flex min-h-12 items-center rounded-full border border-navy px-5 font-semibold text-navy">
          Ask the coordinator
        </Link>
      </div>
    </div>
  );
}
