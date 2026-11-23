"use client";

import Link from "next/link";
import { useState } from "react";
import { DocumentInput } from "@/components/document-input";

/** Upload the confirmation mail RCI sends after a participant registers for this programme on the RCI website. */
export function RciForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{ reference: string; token: string | null } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (fileError) return setError(fileError);
    if (!file) return setError("Attach a screenshot or PDF of the RCI confirmation mail.");
    const form = new FormData(event.currentTarget);
    const body = new FormData();
    for (const [key, value] of form.entries()) if (typeof value === "string") body.set(key, value);
    body.set("creClaim", "yes");
    body.set("rciConfirmation", file);
    setPending(true);
    try {
      const response = await fetch("/api/register/update", { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as { reference?: string; token?: string | null; error?: string };
      if (!response.ok || !payload.reference) {
        setError(payload.error ?? "The confirmation could not be saved.");
        return;
      }
      setDone({ reference: payload.reference, token: payload.token ?? null });
    } catch {
      setError("The network dropped. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <section className="card grid gap-3 p-6" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">RCI confirmation received</p>
        <p className="leading-7 text-muted">
          Saved on {done.reference}. It is read automatically and checked by the organising team; your status updates when it is confirmed.
        </p>
        {done.token ? (
          <Link className="pill pill-solid w-fit" href={`/status/${done.reference}?t=${encodeURIComponent(done.token)}`}>
            See status and acknowledgement
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      <fieldset className="card grid gap-4 p-5">
        <legend className="float-left mb-1 w-full font-display text-lg text-navy">Your registration here</legend>
        <label className="grid gap-1 text-sm font-semibold text-navy">
          Registration reference
          <input className="field" name="reference" required placeholder="YDU-…" autoCapitalize="characters" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-navy">
          Email used at registration
          <input className="field" name="email" type="email" required autoComplete="email" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-navy">
          CRR number
          <input className="field" name="crrNumber" placeholder="A81760" />
          <span className="font-normal text-muted">Needed only if you did not give it when registering.</span>
        </label>
      </fieldset>
      <fieldset className="card grid gap-4 p-5">
        <legend className="float-left mb-1 w-full font-display text-lg text-navy">RCI confirmation mail</legend>
        <DocumentInput
          label="Screenshot or PDF of the mail from RCI"
          hint="Make sure your name or CRR number is visible in the screenshot."
          required
          onReady={(picked, problem) => {
            setFile(picked);
            setFileError(problem);
          }}
        />
      </fieldset>
      {error ? (
        <p className="rounded-2xl bg-navy/5 px-4 py-3 text-green-dark" role="alert">
          {error}
        </p>
      ) : null}
      <button className="pill pill-solid disabled:opacity-60" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Submit RCI confirmation"}
      </button>
    </form>
  );
}
