"use client";

import { useState } from "react";
import { deskCoordinatorLine, programme } from "@/lib/programme";

export function LoginForm({ ready }: { ready: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), code: form.get("code") }),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "Sign-in failed.");
      return;
    }
    window.location.assign("/admin");
  }

  if (!ready) {
    return (
      <p className="rounded-3xl bg-card p-5 leading-7 ring-1 ring-line">
        The coordinator desk is locked until an access code is set for this deployment. {deskCoordinatorLine()} sign in with {programme.email}.
      </p>
    );
  }

  return (
    <form className="grid max-w-md gap-4 rounded-3xl bg-card p-5 ring-1 ring-line" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Email
        <input className="field" name="email" type="email" autoComplete="username" defaultValue={programme.email} required />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Access code
        <input className="field" name="code" type="password" autoComplete="current-password" required />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-green-dark">
          {error}
        </p>
      ) : null}
      <button className="min-h-11 rounded-full bg-green px-5 font-semibold text-white" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Open the desk"}
      </button>
      <p className="text-sm leading-6 text-muted">
        The desk is for {deskCoordinatorLine()}. They use {programme.email} and the same access code.
      </p>
    </form>
  );
}
