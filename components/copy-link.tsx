"use client";

import { useState } from "react";

export function CopyLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <div className="rounded-2xl bg-paper px-4 py-3">
      <p className="text-sm font-semibold text-navy">{label}</p>
      <p className="mt-1 break-all text-sm text-muted">
        <span data-path={path}>{path}</span>
      </p>
      <button type="button" className="mt-2 text-sm font-semibold text-green" onClick={() => void copy()}>
        {copied ? "Copied" : "Copy full link"}
      </button>
    </div>
  );
}
