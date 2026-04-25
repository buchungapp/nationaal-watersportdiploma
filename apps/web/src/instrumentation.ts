import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation/instrumentation.node.ts");
    return;
  }

  await import("./instrumentation/instrumentation.edge.ts");
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { default: posthog } = await import("./lib/posthog");
  const { flatten } = await import("flat");
  const { buildErrorContextProps, extractRouteProps } = await import(
    "./lib/posthog-error-context"
  );

  let distinctId: string | null = null;
  if (request.headers.cookie) {
    const cookieHeader = request.headers.cookie;
    let postHogCookieMatch: RegExpMatchArray | null = null;

    if (typeof cookieHeader === "string") {
      postHogCookieMatch = cookieHeader.match(/ph_phc_.*?_posthog=([^;]+)/);
    } else if (Array.isArray(cookieHeader)) {
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

  const errorContext = buildErrorContextProps(err);
  const routeProps = extractRouteProps(request.path);

  posthog.captureException(err, distinctId || undefined, {
    ...flatten({ request: sanitizedRequest, context }),
    ...errorContext,
    ...routeProps,
    route_path: context.routePath,
    route_type: context.routeType,
    router_kind: context.routerKind,
    render_source: context.renderSource,
    request_path: request.path,
    request_method: request.method,
  });
};
