import { revalidateTag } from "next/cache";

/**
 * Public pages (places left, registration open/closed, the Webex link) keep a saved copy of these figures
 * so that ordinary visits do not wake the database. Every change to registrations or desk settings calls
 * publicChanged(), so the saved copy is replaced at once and never shows stale numbers for long.
 */
export const publicTag = "public-figures";

export function publicChanged(): void {
  try {
    revalidateTag(publicTag);
  } catch {
    // Outside a request (scripts, tests) there is no saved copy to replace.
  }
}
