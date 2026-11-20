"use client";

import { useState } from "react";
import { professions, programme, states, type ArrivalSource } from "@/lib/programme";

type Success = { reference: string };

export function RegisterForm({ source }: { source: ArrivalSource }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        mobile: form.get("mobile"),
        crrNumber: form.get("crrNumber"),
        profession: form.get("profession"),
        designation: form.get("designation"),
        institution: form.get("institution"),
        stateName: form.get("stateName"),
        paymentReference: form.get("paymentReference"),
        accessNeeds: form.get("accessNeeds"),
        fax_number: form.get("fax_number"),
        source,
        consent: form.get("consent") === "on",
      }),
    });
    const body = (await response.json()) as { reference?: string; error?: string };
    setPending(false);
    if (!response.ok || !body.reference) {
      setError(body.error ?? "Registration could not be saved.");
      return;
    }
    setSuccess({ reference: body.reference });
  }

  async function onPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!success) return;
    setPaymentMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/register/payment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reference: success.reference,
        email: form.get("email"),
        paymentReference: form.get("paymentReference"),
      }),
    });
    const body = (await response.json()) as { error?: string };
    setPaymentMessage(response.ok ? "Payment reference saved with this registration." : (body.error ?? "Could not save that reference."));
  }

  if (success) {
    return (
      <section className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-line" aria-live="polite">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green">You are registered</p>
        <h2 className="mt-2 font-serif text-4xl text-navy">{success.reference}</h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Keep this reference. The organising team can see it on the coordinator desk. This page does not send a confirmation email.
          Pay the programme fee on Razorpay, then add the payment reference below. Use the same email as on the form.
        </p>
        <a
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-green px-5 py-3 font-semibold text-white"
          href={programme.paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Pay on Razorpay
        </a>
        <form className="mt-8 grid gap-3" onSubmit={onPayment}>
          <label className="grid gap-1 text-sm font-semibold text-navy">
            Email used at registration
            <input className="field" name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-navy">
            Razorpay payment reference
            <input className="field" name="paymentReference" required />
          </label>
          <button className="min-h-11 rounded-full border border-navy px-5 font-semibold text-navy" type="submit">
            Save payment reference
          </button>
          {paymentMessage ? <p role="status">{paymentMessage}</p> : null}
        </form>
      </section>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit} noValidate>
      <fieldset className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-line">
        <legend className="px-1 font-serif text-2xl text-navy">1. Who is attending</legend>
        <Field label="Full name, as on the CRR" name="fullName" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Mobile" name="mobile" type="tel" autoComplete="tel" required hint="10-digit Indian mobile number" />
        <label className="grid gap-1 text-sm font-semibold text-navy">
          Professional category
          <select className="field" name="profession" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {professions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <Field label="CRR number" name="crrNumber" hint="Example A81760. Students may leave this blank." />
      </fieldset>
      <fieldset className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-line">
        <legend className="px-1 font-serif text-2xl text-navy">2. Where you work</legend>
        <Field label="Designation" name="designation" />
        <Field label="Institution" name="institution" required />
        <label className="grid gap-1 text-sm font-semibold text-navy">
          State or Union Territory
          <select className="field" name="stateName" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset className="grid gap-4 rounded-3xl bg-card p-5 ring-1 ring-line">
        <legend className="px-1 font-serif text-2xl text-navy">3. Payment and access</legend>
        <p className="text-sm leading-6 text-muted">
          The fee is collected on Razorpay, not on this form. If you have already paid, paste the payment reference. Card numbers are never entered here.
        </p>
        <Field label="Razorpay payment reference, if you have it" name="paymentReference" />
        <label className="grid gap-1 text-sm font-semibold text-navy">
          Access needs for the online session
          <textarea className="field min-h-28" name="accessNeeds" maxLength={500} />
        </label>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input className="mt-1 h-5 w-5" type="checkbox" name="consent" required />
          <span>
            I agree that {programme.organiser} may keep these details for registration, attendance, and the CRE certificate for{" "}
            {programme.acknowledgement}.
          </span>
        </label>
      </fieldset>
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Fax
          <input name="fax_number" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error ? (
        <p className="rounded-2xl bg-mint px-4 py-3 text-green-dark" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="min-h-12 rounded-full bg-green px-6 font-semibold text-white disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Saving registration…" : "Register for the programme"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  hint,
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-navy">
      {label}
      <input className="field" name={name} type={type} required={required} autoComplete={autoComplete} />
      {hint ? <span className="font-normal text-muted">{hint}</span> : null}
    </label>
  );
}
