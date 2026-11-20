"use client";

import { useState } from "react";
import { professions, programme, states, type ArrivalSource } from "@/lib/programme";

type Success = {
  reference: string;
  email: string;
  paymentReference: string;
  proofSaved: boolean;
};

export function RegisterForm({ source }: { source: ArrivalSource }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [proofName, setProofName] = useState("");

  function onProof(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    if (!file) {
      setPreview("");
      setProofName("");
      return;
    }
    setProofName(file.name);
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const paymentReference = String(form.get("paymentReference") ?? "").trim();
    const proof = form.get("proof");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email,
        mobile: form.get("mobile"),
        crrNumber: form.get("crrNumber"),
        profession: form.get("profession"),
        designation: form.get("designation"),
        institution: form.get("institution"),
        stateName: form.get("stateName"),
        paymentReference,
        accessNeeds: form.get("accessNeeds"),
        fax_number: form.get("fax_number"),
        source,
        consent: form.get("consent") === "on",
      }),
    });
    const body = (await response.json()) as { reference?: string; error?: string };
    if (!response.ok || !body.reference) {
      setPending(false);
      setError(body.error ?? "Registration could not be saved.");
      return;
    }

    let proofSaved = false;
    let note = "";
    if ((proof instanceof File && proof.size > 0) || paymentReference !== "") {
      const saved = await sendPayment(body.reference, email, paymentReference, proof instanceof File ? proof : null);
      proofSaved = saved.ok && proof instanceof File && proof.size > 0;
      note = saved.ok ? "Payment details are saved on this registration." : saved.error;
    }
    setPending(false);
    setPaymentMessage(note);
    setSuccess({ reference: body.reference, email, paymentReference, proofSaved });
    setPreview("");
    setProofName("");
  }

  async function onPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!success) return;
    setPaymentMessage("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const proof = form.get("proof");
    const paymentReference = String(form.get("paymentReference") ?? "").trim();
    const saved = await sendPayment(success.reference, success.email, paymentReference, proof instanceof File ? proof : null);
    setPending(false);
    if (!saved.ok) {
      setPaymentMessage(saved.error);
      return;
    }
    setSuccess({
      ...success,
      paymentReference: paymentReference || success.paymentReference,
      proofSaved: success.proofSaved || (proof instanceof File && proof.size > 0),
    });
    setPreview("");
    setProofName("");
    setPaymentMessage("Saved on this registration. You do not need to email it.");
  }

  if (success) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-line" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">You are registered</p>
        <h2 className="mt-2 font-serif text-4xl leading-none tracking-tight text-navy sm:text-5xl">{success.reference}</h2>
        <p className="mt-4 max-w-xl leading-7 text-muted">
          Keep this reference. Pay on Razorpay, then add the payment id or a screenshot here. It is stored with this registration, so there is no separate email to send.
        </p>
        <a
          className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-navy px-5 font-semibold text-white"
          href={programme.paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Pay on Razorpay
        </a>
        <form className="mt-8 grid gap-4" onSubmit={onPayment}>
          <input type="hidden" name="email" value={success.email} />
          <p className="text-sm text-muted">Saving for {success.email}</p>
          <PaymentFields preview={preview} proofName={proofName} onProof={onProof} />
          <button className="min-h-12 rounded-lg bg-navy px-5 font-semibold text-white disabled:opacity-60" type="submit" disabled={pending}>
            {pending ? "Saving payment…" : "Save payment on this registration"}
          </button>
          {paymentMessage ? <p role="status">{paymentMessage}</p> : null}
          {success.paymentReference || success.proofSaved ? (
            <p className="text-sm text-navy">
              {success.paymentReference ? `Payment id ${success.paymentReference}. ` : ""}
              {success.proofSaved ? "Screenshot received." : ""}
            </p>
          ) : null}
        </form>
      </section>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit} noValidate>
      <fieldset className="grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-line">
        <legend className="px-1 font-serif text-2xl text-navy">
          <span className="mr-2 text-green">1</span>Who is attending
        </legend>
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
      <fieldset className="grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-line">
        <legend className="px-1 font-serif text-2xl text-navy">
          <span className="mr-2 text-green">2</span>Where you work
        </legend>
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
      <fieldset className="grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-line">
        <legend className="px-1 font-serif text-2xl text-navy">
          <span className="mr-2 text-green">3</span>Payment and access
        </legend>
        <p className="text-sm leading-6 text-muted">
          The fee is collected on Razorpay, not on this form. If you have already paid, add the payment id, a screenshot, or both. Card numbers are never entered here, and you do not email the receipt.
        </p>
        <PaymentFields preview={preview} proofName={proofName} onProof={onProof} />
        <label className="grid gap-1 text-sm font-semibold text-navy">
          Access needs for the online session
          <textarea className="field min-h-28" name="accessNeeds" maxLength={500} />
        </label>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input className="mt-1 h-5 w-5" type="checkbox" name="consent" required />
          <span>
            I agree that {programme.organiser} may keep these details, including the payment note, for registration, attendance, and the CRE certificate for{" "}
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
        <p className="rounded-2xl bg-navy/5 px-4 py-3 text-green-dark" role="alert">
          {error}
        </p>
      ) : null}
      <button className="min-h-12 rounded-lg bg-navy px-6 font-semibold text-white disabled:opacity-60" type="submit" disabled={pending}>
        {pending ? "Saving registration…" : "Register for the programme"}
      </button>
    </form>
  );
}

function PaymentFields({
  preview,
  proofName,
  onProof,
}: {
  preview: string;
  proofName: string;
  onProof: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Razorpay payment id
        <input className="field" name="paymentReference" autoComplete="off" placeholder="From the receipt" />
        <span className="font-normal text-muted">Optional if you upload a screenshot.</span>
      </label>
      <label className="grid cursor-pointer gap-2 rounded-2xl border border-dashed border-navy/30 bg-[#f8fafc] p-4 text-sm font-semibold text-navy">
        Screenshot of the payment
        <input className="sr-only" name="proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={onProof} />
        {preview ? (
          <img src={preview} alt="" className="h-28 w-full rounded-xl bg-white object-contain" />
        ) : (
          <span className="grid h-28 place-items-center rounded-xl bg-white text-center font-normal leading-6 text-muted">
            JPEG, PNG, or WebP, under 3 MB
          </span>
        )}
        <span className="font-normal text-muted">{proofName || "Choose a file, or take a photo of the receipt."}</span>
      </label>
    </div>
  );
}

async function sendPayment(
  reference: string,
  email: string,
  paymentReference: string,
  proof: File | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body = new FormData();
  body.set("reference", reference);
  body.set("email", email);
  body.set("paymentReference", paymentReference);
  if (proof && proof.size > 0) body.set("proof", proof);
  const response = await fetch("/api/register/payment", { method: "POST", body });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) return { ok: false, error: payload.error ?? "The payment could not be saved." };
  return { ok: true };
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
