import type { Metadata } from "next";
import { InstallApp } from "@/components/install-app";
import { PageBanner } from "@/components/page-banner";

export const metadata: Metadata = { title: "Install" };

export default function InstallPage() {
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="On your phone"
        title="Install and use it"
        lede="This is the same programme website, saved to the home screen. There is no separate App Store or Play Store download. Once the icon is there, use it to read the programme, register, and join Webex."
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <InstallApp />
      </div>
    </div>
  );
}
