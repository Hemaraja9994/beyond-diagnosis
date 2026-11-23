import { json } from "@/lib/http";
import { creSeatsLeft } from "@/lib/seats";
import { creSeatLimit, registrationOpen } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public count of RCI CRE places left (no personal data). */
export async function GET() {
  return json({ seats: await creSeatLimit(), left: await creSeatsLeft(), open: await registrationOpen() });
}
