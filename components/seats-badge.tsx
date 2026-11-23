"use client";

import { useEffect, useState } from "react";

/** "RCI CRE places left: 37 of 50" — read live from the site. */
export function SeatsBadge({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const [data, setData] = useState<{ seats: number; left: number; open?: boolean } | null>(null);
  useEffect(() => {
    fetch("/api/seats", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value: { seats: number; left: number; open?: boolean } | null) => setData(value))
      .catch(() => setData(null));
  }, []);
  if (!data) return null;
  if (data.open === false) {
    return (
      <p className={`inline-flex rounded-full px-4 py-2 text-sm ring-1 ${tone === "dark" ? "bg-white/10 text-white ring-white/25" : "bg-white text-navy ring-line"} ${className}`} role="status">
        <strong>Registration is closed</strong>
      </p>
    );
  }
  const full = data.left <= 0;
  const colours = tone === "dark" ? "bg-white/10 text-white ring-white/25" : "bg-white text-navy ring-line";
  return (
    <p className={`inline-flex flex-wrap items-center gap-2 rounded-full px-4 py-2 text-sm ring-1 ${colours} ${className}`} role="status">
      <span className={`h-2.5 w-2.5 rounded-full ${full ? "bg-red-500" : data.left <= 10 ? "bg-amber-400" : "bg-emerald-500"}`} aria-hidden="true" />
      {full ? (
        <span>
          <strong>RCI CRE places full</strong> — you can still register to attend
        </span>
      ) : (
        <span>
          <strong>
            RCI CRE places left: {data.left} of {data.seats}
          </strong>{" "}
          · first come, first served
        </span>
      )}
    </p>
  );
}
