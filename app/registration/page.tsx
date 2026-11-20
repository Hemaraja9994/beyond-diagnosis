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
    <div className="pb-24 md:pb-10">
      <PageBanner
        kicker="Registration"
        title="Register on this website"
        lede="Use the same name and CRR number that should appear on the certificate. Payment opens on Razorpay after you have a reference."
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_18rem]">
        <RegisterForm source={source} />
        <aside className="h-fit rounded-3xl bg-navy p-5 text-white lg:sticky lg:top-28">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-mint">Before you pay</p>
          <ol className="mt-3 grid list-decimal gap-3 pl-5 leading-7">
            <li>Submit this form and keep the reference.</li>
            <li>Pay on Razorpay. The amount is the one shown there.</li>
            <li>Return and attach the payment reference to the same email.</li>
          </ol>
          <a
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-4 font-semibold text-navy"
            href={programme.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Razorpay
          </a>
        </aside>
      </div>
    </div>
  );
}
