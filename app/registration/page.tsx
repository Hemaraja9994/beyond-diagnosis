import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { RegisterForm } from "@/components/register-form";
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
        kicker="Registration · Only 50 seats"
        title="Reserve"
        accent="your seat"
        lede="Enter your name and CRR number exactly as they should appear on the certificate. After submitting, pay on Razorpay and add your receipt on the confirmation screen."
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_18rem] lg:items-start">
        <RegisterForm source={source} />
        <aside className="info-card accent-1 h-fit lg:sticky lg:top-32">
          <h2>How payment works</h2>
          <div>
          <ol className="grid gap-4">
            {[
              ["1", "Register and keep the reference shown on this page."],
              ["2", "Pay on Razorpay. The amount is the one shown there."],
              ["3", "After payment, add the payment id or the screenshot on the confirmation screen."],
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
          </div>
        </aside>
      </div>
    </div>
  );
}
