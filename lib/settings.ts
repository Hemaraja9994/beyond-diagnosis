import { programme } from "@/lib/programme";
import { getSetting, setSetting } from "@/lib/store";

/** Switches the coordinators change from the desk, without touching code. */
export async function creSeatLimit(): Promise<number> {
  const saved = await getSetting("cre_seats").catch(() => null);
  // Nothing saved yet (or unreadable) means the programme's own number, never 0.
  if (saved === null || saved.trim() === "") return programme.creSeats;
  const value = Number(saved);
  return Number.isInteger(value) && value >= 0 && value <= 2000 ? value : programme.creSeats;
}

export async function registrationOpen(): Promise<boolean> {
  if (programme.registrationClosed) return false;
  return (await getSetting("registration_open").catch(() => null)) !== "no";
}

export async function setCreSeatLimit(value: number): Promise<void> {
  await setSetting("cre_seats", String(value));
}

export async function setRegistrationOpen(open: boolean): Promise<void> {
  await setSetting("registration_open", open ? "yes" : "no");
}
