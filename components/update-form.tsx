"use client";

import { useState } from "react";
import { DocumentInput } from "@/components/document-input";
import { programme, titles } from "@/lib/programme";

type FileField = "receipt" | "crrCertificate" | "rciConfirmation";
type Saved = { reference: string; token: string | null; creClaim: string; crrNumber: string; paymentReference: string; documents: string[] };

/** For people who registered before (old flow), and for adding the RCI confirmation later. */
export function UpdateForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [claim, setClaim] = useState<"" | "yes" | "no">("");
  const [files, setFiles] = useState<Partial<Record<FileField, File>>>({});
  const [fileErrors, setFileErrors] = useState<Partial<Record<FileField, string>>>({});
  const [formKey, setFormKey] = useState(0);

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
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    for (const [key, value] of form.entries()) if (typeof value === "string") body.set(key, value);
    for (const [field, file] of Object.entries(files)) if (file) body.set(field, file);
    setPending(true);
    try {
      const response = await fetch("/api/register/update", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as Partial<Saved> & { error?: string };
      if (!response.ok || !payload.reference) {
        setError(payload.error ?? "The update could not be saved.");
        return;
      }
      setSaved(payload as Saved);
      setFiles({});
      setFormKey((key) => key + 1);
    } catch {
      setError("The network dropped. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form key={formKey} className="grid gap-6" onSubmit={onSubmit} noValidate>
      <fieldset className="card grid gap-4 p-5">
        <legend className="px-1 font-display text-lg text-navy">Find your registration</legend>
        <Field label="Registration reference" name="reference" required hint="Starts with YDU-, shown after you registered." defaultValue={saved?.reference} />
        <Field label="Email used at registration" name="email" type="email" required autoComplete="email" />
      </fieldset>

      <fieldset className="card grid gap-4 p-5">
        <legend className="px-1 font-display text-lg text-navy">Add or correct</legend>
        <p className="text-sm leading-6 text-muted">Leave anything blank to keep it as it is. To change your name or email, write to {programme.email}.</p>
        <label className="grid max-w-xs gap-1 text-sm font-semibold text-navy">
          Title
          <select className="field" name="title" defaultValue="">
            <option value="">Keep as it is</option>
            {titles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-navy">
          Claiming RCI CRE points?
          <select className="field" name="creClaim" value={claim} onChange={(event) => setClaim(event.target.value as "" | "yes" | "no")}>
            <option value="">Keep as it is</option>
            <option value="yes">Yes — RCI-registered, claiming CRE points</option>
            <option value="no">No — student, or not on the CRR</option>
          </select>
        </label>
        <Field label="CRR number" name="crrNumber" hint="Required if claiming CRE points, e.g. A81760." />
        <Field label="Payment ID" name="paymentReference" hint="Only if you have not given it yet (pay_… or UPI transaction number)." />
        <div className="grid gap-4 sm:grid-cols-3">
          <DocumentInput label="Payment receipt" hint="Replaces any earlier receipt." onReady={fileReady("receipt")} />
          <DocumentInput label="CRR certificate" hint="Certificate or card." onReady={fileReady("crrCertificate")} />
          <DocumentInput label="RCI confirmation" hint="Mail from the RCI website." onReady={fileReady("rciConfirmation")} />
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-2xl bg-navy/5 px-4 py-3 text-green-dark" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <div className="rounded-2xl bg-green/10 px-4 py-3 text-sm leading-6 text-navy" role="status">
          <p className="font-semibold">Saved on {saved.reference}.</p>
          <p>
            CRE points: {saved.creClaim === "yes" ? "claiming" : saved.creClaim === "no" ? "not claiming" : "not stated"} · CRR {saved.crrNumber || "—"} ·
            Payment ID {saved.paymentReference || "—"} · Files on record: {saved.documents.length > 0 ? saved.documents.join(", ") : "none"}
          </p>
          {saved.token ? (
            <p className="mt-2">
              <a className="font-semibold text-green underline" href={`/status/${saved.reference}?t=${encodeURIComponent(saved.token)}`}>
                Status and acknowledgement PDF
              </a>
            </p>
          ) : null}
          <p className="mt-2">
            <a className="font-semibold text-green underline" href={programme.whatsappUrl} target="_blank" rel="noopener noreferrer">
              Join the participants&apos; WhatsApp group
            </a>
          </p>
        </div>
      ) : null}
      <button className="pill pill-solid disabled:opacity-60" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
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
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-navy">
      {label}
      <input className="field" name={name} type={type} required={required} autoComplete={autoComplete} defaultValue={defaultValue} />
      {hint ? <span className="font-normal text-muted">{hint}</span> : null}
    </label>
  );
}
