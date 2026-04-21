import "server-only";
import { notFound } from "next/navigation";
import { leercoachEnabled } from "~/lib/flags";

// Flag-gate for leercoach server components. Call this at the top of
// every page.tsx under /leercoach — disabled flag → 404.
//
// Placement rule: call BEFORE requireInstructorPerson. Role gating is
// meaningful only when the feature is available; flipping that order
// would leak "the feature exists but you lack permission" when the
// feature hasn't rolled out to the caller. 404 is correct for both.
export async function requireLeercoachEnabled(): Promise<void> {
  if (!(await leercoachEnabled())) notFound();
}
