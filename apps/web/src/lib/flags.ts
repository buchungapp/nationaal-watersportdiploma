import "server-only";
import { type Flag, flag } from "flags/next";
import { getUserOrThrow } from "./nwd";
import posthog from "./posthog";

// Feature flags for the web app. Each flag is backed by a PostHog
// boolean (or multivariate) flag with the same key; the decide()
// function centralises the evaluation path so pages/routes only see
// a simple `await xFlag()` boolean.
//
// Dev behaviour: every flag returns its "permissive" default when
// NODE_ENV === "development" so local iteration doesn't need a
// PostHog round-trip or an explicit opt-in. Production always
// evaluates via PostHog, distinctId = user.authUserId (same id
// SessionProvider calls posthog.identify() with on sign-in).
//
// Creating new flags:
//   1. `flag({ key, decide, defaultValue, description, options })`
//      — key must exactly match the PostHog flag key.
//   2. Export as `Flag<T>` so consumers get typed evaluation.
//   3. Production default should be CONSERVATIVE: if PostHog fails
//      or the flag doesn't exist, the app stays off until ops adds
//      it intentionally.

export const leercoachEnabled: Flag<boolean> = flag({
  key: "leercoach-enabled",
  async decide() {
    // Dev bypass: always enabled locally. Keeps the feature iterable
    // without a PostHog flag setup and stops `pnpm dev` from needing
    // the prod PostHog key at all.
    if (process.env.NODE_ENV === "development") return true;

    // Unauth users don't see the leercoach at all — cheaper to
    // short-circuit here than to call PostHog with a missing
    // distinct_id (which would bucket everyone as the same anon).
    const user = await getUserOrThrow().catch(() => null);
    if (!user) return false;

    // Production path: PostHog decides based on the flag's rollout
    // rules (targeting, %-rollout, etc). Boolean flag → returns
    // literal true when enabled for this user.
    //
    // Fail-closed on any PostHog error: a dropped connection / rate
    // limit / missing flag definition must not accidentally enable
    // the feature for everyone. The default value below only applies
    // when flags/next itself can't call decide (e.g. no request
    // context); this try/catch handles runtime failures inside it.
    try {
      const enabled = await posthog.getFeatureFlag(
        "leercoach-enabled",
        user.authUserId,
      );
      return enabled === true;
    } catch (err) {
      console.error("[flags] leercoach-enabled PostHog lookup failed", err);
      return false;
    }
  },
  defaultValue: false,
  description:
    "Gate for the digitale leercoach feature (landing page, chat UI, portfolio pages, API routes, and the dashboard entry point).",
  options: [
    { value: true, label: "Enabled" },
    { value: false, label: "Disabled" },
  ],
});
