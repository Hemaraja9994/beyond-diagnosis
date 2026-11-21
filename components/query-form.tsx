"use client";

import { useState } from "react";

export function QueryForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/queries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        email: form.get("email"),
        topic: form.get("topic"),
        message: form.get("message"),
        fax_number: form.get("fax_number"),
      }),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "The message could not be sent.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="rounded-3xl bg-navy/5 px-5 py-4 leading-7 text-green-dark" role="status">
        Thank you. Your query has reached the organising team, and they will reply to you by email.
      </p>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Name
        <input className="field" name="fullName" autoComplete="name" required />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Email
        <input className="field" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Topic
        <input className="field" name="topic" required />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Query
        <textarea className="field min-h-32" name="message" required minLength={10} maxLength={2000} />
      </label>
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Fax
          <input name="fax_number" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-green-dark">
          {error}
        </p>
      ) : null}
      <button className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Sending…" : "Send query"}
      </button>
    </form>
  );
}
