import { waitUntil as vercelWaitUntil } from "@vercel/functions";

// Hand a promise off to the runtime so the response can flush before
// it resolves. On Vercel Fluid Compute this hooks the function lifetime;
// elsewhere (e.g. local node-server, tests) the promise just runs in
// the background. Either way we swallow rejections so a failing
// background job never crashes the process.
export function waitUntil(promise: Promise<unknown>): void {
  const safe = promise.catch((err) => {
    console.error("waitUntil background task failed:", err);
  });

  try {
    vercelWaitUntil(safe);
  } catch {
    // Outside a Vercel function context — promise is already running.
  }
}
