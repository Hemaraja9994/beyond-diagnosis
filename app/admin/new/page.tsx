import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeskFields, DeskUploads } from "@/components/desk-fields";
import { PageBanner } from "@/components/page-banner";
import { currentAdmin, deskUser } from "@/lib/admin";

export const metadata: Metadata = { title: "Add registration", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewRegistrationPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!deskUser(await currentAdmin())) redirect("/admin");
  const { saved } = await searchParams;
  return (
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Coordinator desk · master control"
        title="Add a"
        accent="registration"
        lede="For an offline payment, a guest or a correction. The CRE place limit and the receipt requirement do not apply here."
      />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        <p className="text-sm">
          <Link className="font-semibold text-green underline" href="/admin">
            ← Back to the desk
          </Link>
        </p>
        {saved ? (
          <p className="rounded-2xl bg-navy/5 px-4 py-3 font-semibold text-navy" role="status">
            {saved}
          </p>
        ) : null}
        <form className="card grid gap-4 p-5" action="/api/admin/new" method="post" encType="multipart/form-data">
          <label className="grid gap-1 text-sm font-semibold text-navy sm:max-w-md">
            Programme track
            <select className="field" name="track" defaultValue="rci">
              <option value="rci">RCI CRE programme</option>
              <option value="online">Participant registration (offline hands-on or online, no CRE points)</option>
            </select>
            <span className="font-normal text-muted">Participant registrations are always saved as not claiming CRE. Set its attendance (offline or online) below.</span>
          </label>
          <DeskFields />
          <h3 className="font-semibold text-navy">Documents (optional)</h3>
          <DeskUploads />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="paymentVerified" className="h-4 w-4" /> Payment already verified (e.g. paid offline)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sendEmail" className="h-4 w-4" defaultChecked /> Send the confirmation email with the acknowledgement
          </label>
          <button className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white" type="submit">
            Add registration
          </button>
        </form>
      </div>
    </div>
  );
}
