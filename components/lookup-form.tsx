"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LookupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/register/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reference: form.get("reference"), email: form.get("email") }),
      });
      const payload = (await response.json().catch(() => ({}))) as { reference?: string; token?: string; error?: string };
      if (!response.ok || !payload.reference || !payload.token) {
        setError(payload.error ?? "That registration could not be found.");
        return;
      }
      router.push(`/status/${payload.reference}?t=${encodeURIComponent(payload.token)}`);
    } catch {
      setError("The network dropped. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Registration reference
        <input className="field" name="reference" required placeholder="YDU-…" autoCapitalize="characters" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Email used at registration
        <input className="field" name="email" type="email" required autoComplete="email" />
      </label>
      {error ? (
        <p className="text-sm text-green-dark" role="alert">
          {error}
        </p>
      ) : null}
      <button className="pill pill-solid disabled:opacity-60" type="submit" disabled={pending}>
        {pending ? "Looking up…" : "Show status and acknowledgement"}
      </button>
    </form>
  );
}
