import { unstable_cache } from "next/cache";
import { programme } from "@/lib/programme";
import { publicTag } from "@/lib/public-tag";
import { creSeatsLeft } from "@/lib/seats";
import { creSeatLimit, registrationOpen } from "@/lib/settings";
import { getMeetingUrl } from "@/lib/store";

/** At most one database read an hour from public visits; publicChanged() refreshes it as soon as data changes. */
const savedFor = 60 * 60;

export type PublicFigures = { seats: number; left: number; open: boolean };

const readFigures = unstable_cache(
  async (): Promise<PublicFigures> => {
    const [seats, left, open] = await Promise.all([creSeatLimit(), creSeatsLeft(), registrationOpen()]);
    return { seats, left, open };
  },
  ["public-figures-v1"],
  { revalidate: savedFor, tags: [publicTag] },
);

const readMeetingUrl = unstable_cache(async () => getMeetingUrl(), ["public-meeting-url-v1"], {
  revalidate: savedFor,
  tags: [publicTag],
});

/** Places left and whether registration is open, for public pages. Falls back to safe values if unreadable. */
export async function publicFigures(): Promise<PublicFigures> {
  return readFigures().catch(() => ({ seats: programme.creSeats, left: programme.creSeats, open: true }));
}

export async function publicMeetingUrl(): Promise<string | null> {
  return readMeetingUrl().catch(() => null);
}
