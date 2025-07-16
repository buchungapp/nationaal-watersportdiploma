import posthog from "posthog-js";
import { BASE_URL } from "./constants";
import { invariant } from "./utils/invariant";

invariant(process.env.NEXT_PUBLIC_POSTHOG_KEY, "Missing PostHog key");

const currentUrl = new URL(BASE_URL);
currentUrl.pathname = "/ingest";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  api_host: `${currentUrl.toString().replace(/\/$/, "")}`,
  capture_pageview: false, // Disable automatic pageview capture, as we capture manually
});
