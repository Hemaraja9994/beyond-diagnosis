"use client";

import Link from "next/link";
import { useState } from "react";
import { AckActions } from "@/components/ack-actions";
import { DocumentInput } from "@/components/document-input";
import { professions, programme, states, titles, type ArrivalSource } from "@/lib/programme";

type Success = { reference: string; email: string; claiming: boolean; token: string | null };
type FileField = "receipt" | "crrCertificate" | "rciConfirmation";

export function RegisterForm({ source }: { source: ArrivalSource }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);
  const [profession, setProfession] = useState("");
  const [claim, setClaim] = useState<"" | "yes" | "no">("");
  const [files, setFiles] = useState<Partial<Record<FileField, File>>>({});
  const [fileErrors, setFileErrors] = useState<Partial<Record<FileField, string>>>({});

  function fileReady(field: FileField) {
    return (file: File | null, problem: string) => {
      setFiles((current) => {
        const next = { ...current };
        if (file) next[field] = file;
        else delete next[field];
        return next;
      });
      setFileErrors((current) => ({ ...current, [field]: problem }));
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const problem = Object.values(fileErrors).find((value) => value);
    if (problem) {
      setError(problem);
      return;
    }
    if (!files.receipt) {
      setError("Attach the payment receipt or screenshot.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    for (const [key, value] of form.entries()) if (typeof value === "string") body.set(key, value);
    body.set("source", source);
    body.set("receipt", files.receipt);
    if (claim === "yes" && files.crrCertificate) body.set("crrCertificate", files.crrCertificate);
    if (claim === "yes" && files.rciConfirmation) body.set("rciConfirmation", files.rciConfirmation);
    if (claim !== "yes") body.delete("crrNumber");

    setPending(true);
    try {
      const response = await fetch("/api/register", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as { reference?: string; token?: string | null; error?: string };
      if (!response.ok || !payload.reference) {
        setError(
          payload.error ??
            (response.status === 413 ? "The attached files are too large together. Use smaller screenshots." : "Registration could not be saved."),
        );
        return;
      }
      setSuccess({ reference: payload.reference, email: String(form.get("email") ?? ""), claiming: claim === "yes", token: payload.token ?? null });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("The network dropped. Check your connection and submit again.");
    } finally {
      setPending(false);
    }
  }

  if (success) return <Confirmation success={success} />;

  return (
    <div className="grid gap-6">
      <section className="card p-5" aria-labelledby="pay-step">
        <h2 id="pay-step" className="font-display text-xl text-navy sm:text-2xl">
          <span className="mr-2 text-green">1</span>Pay {programme.feeLabel} on Razorpay
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          One fee for everyone — professionals and students. Use the same name, email and mobile on Razorpay that you will enter below.
        </p>
        <ol className="mt-3 grid gap-1 text-sm leading-6">
          <li>· Pay on the Razorpay page (opens in a new tab).</li>
          <li>· Keep the receipt: a screenshot of the success screen, or the Razorpay email / PDF receipt.</li>
          <li>
            · Note the <strong>Payment ID</strong> (starts with <code>pay_</code>). If you only have a UPI app screenshot, the UPI transaction number
            works too.
          </li>
        </ol>
        <a className="pill pill-solid mt-4" href={programme.paymentUrl} target="_blank" rel="noopener noreferrer">
          Pay {programme.feeLabel} on Razorpay
        </a>
      </section>

      <form className="grid gap-6" onSubmit={onSubmit} noValidate>
        <p className="font-display text-xl text-navy sm:text-2xl">
          <span className="mr-2 text-green">2</span>Register with your payment
        </p>
        <fieldset className="card grid gap-4 p-5">
          <legend className="px-1 font-display text-lg text-navy">Who is attending</legend>
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <label className="grid gap-1 text-sm font-semibold text-navy">
              Title
              <select className="field" name="title" required defaultValue="">
                <option value="" disabled>
                  Choose
                </option>
                {titles.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Full name, as on the CRR / certificate" name="fullName" autoComplete="name" required />
          </div>
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Mobile" name="mobile" type="tel" autoComplete="tel" required hint="10-digit Indian mobile number" />
          <label className="grid gap-1 text-sm font-semibold text-navy">
            Professional category
            <select className="field" name="profession" required value={profession} onChange={(event) => setProfession(event.target.value)}>
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
          {profession === "other" ? (
            <Field label="Your profession" name="professionDetail" required hint="A few words, for example private practitioner." />
          ) : null}
        </fieldset>

        <fieldset className="card grid gap-4 p-5">
          <legend className="px-1 font-display text-lg text-navy">RCI CRE points</legend>
          <p className="text-sm leading-6 text-muted">
            Everyone may attend. Only participants registered on the Central Rehabilitation Register (CRR) of RCI can claim CRE points.
          </p>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Claiming RCI CRE points">
            <Choice name="creClaim" value="yes" checked={claim === "yes"} onChange={() => setClaim("yes")}>
              Yes — I am RCI-registered and will claim CRE points
            </Choice>
            <Choice name="creClaim" value="no" checked={claim === "no"} onChange={() => setClaim("no")}>
              No — student, or not on the CRR
            </Choice>
          </div>
          {claim === "yes" ? (
            <div className="grid gap-4">
              <Field label="CRR number" name="crrNumber" required hint="As on your RCI registration, e.g. A81760." />
              <div className="grid gap-4 sm:grid-cols-2">
                <DocumentInput
                  label="CRR certificate or card"
                  hint="Helps us match your name and CRR number."
                  onReady={fileReady("crrCertificate")}
                />
                <DocumentInput
                  label="RCI portal registration confirmation"
                  hint="The confirmation mail from the RCI website. Can be added later on “Add RCI confirmation”."
                  onReady={fileReady("rciConfirmation")}
                />
              </div>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="card grid gap-4 p-5">
          <legend className="px-1 font-display text-lg text-navy">Where you work</legend>
          <Field label="Designation" name="designation" />
          <Field label="Workplace" name="institution" required hint="A college, hospital, clinic, or private practice." />
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

        <fieldset className="card grid gap-4 p-5">
          <legend className="px-1 font-display text-lg text-navy">Payment details</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid content-start gap-1 text-sm font-semibold text-navy">
              <span>
                Payment ID<span className="text-green"> *</span>
              </span>
              <input className="field" name="paymentReference" autoComplete="off" required placeholder="pay_XXXXXXXXXXXXXX" />
              <span className="font-normal text-muted">From the Razorpay receipt, or the UPI transaction number.</span>
            </label>
            <DocumentInput
              label="Payment receipt or screenshot"
              hint="Checked automatically against your name and payment ID."
              required
              onReady={fileReady("receipt")}
            />
          </div>
          <p className="text-xs leading-5 text-muted">Card numbers and bank passwords are never asked for here.</p>
        </fieldset>

        <fieldset className="card grid gap-4 p-5">
          <legend className="px-1 font-display text-lg text-navy">Access and consent</legend>
          <label className="grid gap-1 text-sm font-semibold text-navy">
            Access needs for the online session
            <textarea className="field min-h-24" name="accessNeeds" maxLength={500} />
          </label>
          <label className="flex items-start gap-3 text-sm leading-6">
            <input className="mt-1 h-5 w-5 shrink-0" type="checkbox" name="consent" required />
            <span>
              I agree that the {programme.organiser}, {programme.university}, may keep these details and the uploaded documents for registration,
              attendance, certification and RCI CRE reporting. The receipt and certificate are read automatically on the organisers&apos; own server
              to check them against this form; they are not sent to any outside AI service.
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
        <button className="pill pill-solid disabled:opacity-60" type="submit" disabled={pending}>
          {pending ? "Saving registration…" : "Submit registration"}
        </button>
        <p className="text-sm text-muted">
          Registered earlier?{" "}
          <Link className="font-semibold text-green underline" href="/registration/update">
            Update my registration
          </Link>{" "}
          ·{" "}
          <Link className="font-semibold text-green underline" href="/registration/rci">
            Add RCI confirmation
          </Link>{" "}
          ·{" "}
          <Link className="font-semibold text-green underline" href="/registration/status">
            Status and acknowledgement
          </Link>
        </p>
      </form>
    </div>
  );
}

function Confirmation({ success }: { success: Success }) {
  return (
    <section className="card p-6" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">Registration received</p>
      <h2 className="mt-2 font-display text-4xl leading-none tracking-tight text-navy sm:text-5xl">{success.reference}</h2>
      <p className="mt-4 max-w-xl leading-7 text-muted">
        Please note this reference. Your receipt is being checked against your details for {success.email}; the organising team confirms every
        seat.
      </p>
      {success.claiming ? (
        <p className="mt-3 max-w-xl rounded-2xl bg-navy/5 px-4 py-3 text-sm leading-6 text-navy">
          Claiming CRE points: once you register for this programme on the RCI website, upload the RCI confirmation mail on{" "}
          <Link className="font-semibold underline" href="/registration/rci">
            Add RCI confirmation
          </Link>{" "}
          with this reference.
        </p>
      ) : null}
      {success.token ? (
        <div className="mt-6">
          <AckActions reference={success.reference} token={success.token} />
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="pill pill-solid" href={programme.whatsappUrl} target="_blank" rel="noopener noreferrer">
          Join the participants&apos; WhatsApp group
        </a>
        <Link className="pill pill-navy" href="/programme">
          See the programme
        </Link>
      </div>
    </section>
  );
}

function Choice({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm leading-6 ${checked ? "border-green bg-green/5" : "border-line"}`}
    >
      <input className="mt-1 h-5 w-5 shrink-0" type="radio" name={name} value={value} checked={checked} onChange={onChange} required />
      <span>{children}</span>
    </label>
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
