import type { Metadata } from "next";
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
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green">Registration</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[0.95] tracking-tight text-navy sm:text-6xl">Register on this website</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">
            Use the same name and CRR number that should appear on the certificate. Pay on Razorpay after this form is saved, then add the receipt on the confirmation screen.
          </p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_18rem] lg:items-start">
        <RegisterForm source={source} />
        <aside className="h-fit rounded-3xl bg-white p-5 ring-1 ring-line lg:sticky lg:top-28">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">Payment</p>
          <ol className="mt-4 grid gap-4">
            {[
              ["1", "Register and keep the reference shown on this page."],
              ["2", "Pay on Razorpay. The amount is the one shown there."],
              ["3", "After payment, add the payment id or the screenshot on the confirmation screen."],
            ].map(([step, text]) => (
              <li key={step} className="grid grid-cols-[2rem_1fr] gap-2 text-sm leading-6">
                <span className="font-serif text-2xl text-green">{step}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <a
            className="ticked mt-5 inline-flex min-h-12 items-center rounded-lg bg-navy px-4 font-semibold text-white"
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
