import type { Metadata } from "next";
import { InstallApp } from "@/components/install-app";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "Install" };

export default function InstallPage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="On your phone"
        title="Add it to"
        accent="your phone"
        lede="Add this programme website to your phone's home screen for one-tap access to the schedule, registration and the Webex session. No app store download is needed."
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <InstallApp />
      </div>
    </div>
  );
}
