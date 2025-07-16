import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // @ts-expect-error - This is a dynamic import
    await import("./instrumentation/instrumentation.node.ts");
    return;
  }

  // @ts-expect-error - This is a dynamic import
  await import("./instrumentation/instrumentation.edge.ts");
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: posthog } = await import("./lib/posthog");
    const { flatten } = await import("flat");

    let distinctId = null;
    if (request.headers.cookie) {
      const cookieHeader = request.headers.cookie;
      let postHogCookieMatch: RegExpMatchArray | null = null;

      if (typeof cookieHeader === "string") {
        postHogCookieMatch = cookieHeader.match(/ph_phc_.*?_posthog=([^;]+)/);
      } else if (Array.isArray(cookieHeader)) {
        // If cookie is an array, join into a single string
        postHogCookieMatch = cookieHeader
          .join("; ")
          .match(/ph_phc_.*?_posthog=([^;]+)/);
      }

      if (postHogCookieMatch?.[1]) {
        try {
          const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
          const postHogData = JSON.parse(decodedCookie);
          distinctId = postHogData.distinct_id;
        } catch (e) {
          console.error("Error parsing PostHog cookie:", e);
        }
      }
    }

    // Create a sanitized request object without sensitive headers
    const sensitiveHeaders = [
      "cookie",
      "authorization",
      "x-api-key",
      "x-auth-token",
      "x-access-token",
      "x-refresh-token",
      "auth-token",
      "bearer",
      "x-forwarded-for",
      "x-real-ip",
      "x-client-ip",
      "cf-connecting-ip",
      "true-client-ip",
    ];

    const sanitizedRequest = {
      ...request,
      headers: Object.fromEntries(
        Object.entries(request.headers).filter(
          ([key]) => !sensitiveHeaders.includes(key.toLowerCase()),
        ),
      ),
    };

    posthog.captureException(
      err,
      distinctId || undefined,
      flatten({
        request: sanitizedRequest,
        context,
      }),
    );
  }
};
