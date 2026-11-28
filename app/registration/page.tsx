import type { Metadata } from "next";
import { PageBanner } from "@/components/page-banner";
import { RegisterForm } from "@/components/register-form";
import { RegistrationLinks } from "@/components/registration-links";
import { onlineProgramme, programme, type ArrivalSource } from "@/lib/programme";
import { creSeatsLeft } from "@/lib/seats";
import { creSeatLimit, registrationOpen } from "@/lib/settings";

export const metadata: Metadata = { title: "Registration" };
export const dynamic = "force-dynamic";

const sources: ArrivalSource[] = ["rci", "site", "join", "direct"];

export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const query = await searchParams;
  const source = sources.find((item) => item === query.from) ?? "direct";
  const [seatsLeft, seatLimit, open] = await Promise.all([
    creSeatsLeft().catch(() => programme.creSeats),
    creSeatLimit().catch(() => programme.creSeats),
    registrationOpen().catch(() => true),
  ]);

  return (
    <div id="register" className="pb-24 md:pb-10">
      <PageBanner
        kicker="Registration"
        title={open ? "Reserve" : "Registration"}
        accent={open ? "your seat" : "is closed"}
        lede={
          open
            ? `Pay ${programme.feeLabel} on Razorpay first, then register here with your payment ID and receipt. Enter your name and CRR number exactly as they should appear on the certificate.`
            : "Registration for this programme has closed. Registered participants will receive the webinar link."
        }
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_18rem] lg:items-start">
        {open ? (
          <RegisterForm source={source} creSeatsLeft={seatsLeft} creSeatLimit={seatLimit} />
        ) : (
          <section className="card p-6">
            <h2 className="font-display text-2xl text-navy">Registration is closed</h2>
            <p className="mt-2 leading-7 text-muted">
              Registration for this programme has closed, and no new registrations are being taken. Registered participants will receive the
              webinar link. Already registered? Use the links here to check your status, add your RCI confirmation or download your
              acknowledgement. For anything else, write to {programme.email}.
            </p>
            <div className="mt-5 rounded-2xl bg-navy/5 p-4">
              <p className="font-semibold text-navy">Not claiming RCI CRE points?</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Staff and students of Yenepoya colleges — psychologists, neurologists and other doctors and allied health professionals who certify disability — can still
                register as participants for the offline hands-on at YMC until {onlineProgramme.closesLabel}, {onlineProgramme.seats} seats. {onlineProgramme.noCreLine}
              </p>
              <a className="pill pill-solid mt-3" href={onlineProgramme.path}>
                Participant registration
              </a>
            </div>
          </section>
        )}
        <aside className="info-card accent-1 h-fit lg:sticky lg:top-32">
          <h2>How registration works</h2>
          <div>
          <ol className="grid gap-4">
            {[
              ["1", `Pay ${programme.feeLabel} on Razorpay — same fee for everyone.`],
              ["2", "Save the receipt and note the Payment ID (pay_…)."],
              ["3", "Fill the form, attach the receipt, and keep your YDU- reference."],
              ["4", "Download or WhatsApp your acknowledgement PDF."],
              programme.creClosed
                ? ["5", `All ${programme.creSeats} RCI CRE places are filled, so new registrations attend without CRE points.`]
                : ["5", "Claiming CRE points? Register on the RCI website, then upload RCI's confirmation mail here."],
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
