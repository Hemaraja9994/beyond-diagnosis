import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { RegisterForm } from "@/components/register-form";
import { RegistrationLinks } from "@/components/registration-links";
import { programme, type ArrivalSource } from "@/lib/programme";

export const metadata: Metadata = { title: "Registration" };

const sources: ArrivalSource[] = ["rci", "site", "join", "direct"];

export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const query = await searchParams;
  const source = sources.find((item) => item === query.from) ?? "direct";

  return (
    <div id="register" className="pb-24 md:pb-10">
      <PageBanner
        kicker="Registration"
        title="Reserve"
        accent="your seat"
        lede={`Pay ${programme.feeLabel} on Razorpay first, then register here with your payment ID and receipt. Enter your name and CRR number exactly as they should appear on the certificate.`}
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_18rem] lg:items-start">
        <RegisterForm source={source} />
        <aside className="info-card accent-1 h-fit lg:sticky lg:top-32">
          <h2>How registration works</h2>
          <div>
          <ol className="grid gap-4">
            {[
              ["1", `Pay ${programme.feeLabel} on Razorpay — same fee for everyone.`],
              ["2", "Save the receipt and note the Payment ID (pay_…)."],
              ["3", "Fill the form, attach the receipt, and keep your YDU- reference."],
              ["4", "Download or WhatsApp your acknowledgement PDF."],
              ["5", "Claiming CRE points? Register on the RCI website, then upload RCI's confirmation mail here."],
            ].map(([step, text]) => (
              <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-display font-bold text-white">{step}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <a
            className="pill pill-solid mt-5 w-full"
            href={programme.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Razorpay
          </a>
          <RegistrationLinks className="mt-5" />
          </div>
        </aside>
      </div>
    </div>
  );
}
