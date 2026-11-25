import { json } from "@/lib/http";
import { publicFigures } from "@/lib/public-figures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public count of RCI CRE places left (no personal data), from the saved copy that changes refresh. */
export async function GET() {
  return json(await publicFigures());
}
