"use client";

import { useState } from "react";

export function MeetingForm({ current }: { current: string | null }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/meeting", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: form.get("url") }),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    setMessage(response.ok ? "Webex link saved. The Join button now opens it." : (body.error ?? "Could not save the link."));
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-semibold text-navy">
        Cisco Webex link
        <input className="field" name="url" type="url" defaultValue={current ?? ""} placeholder="https://....webex.com/..." required />
      </label>
      <button className="min-h-11 rounded-full bg-navy px-5 font-semibold text-white" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Webex link"}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
