import type { Flag } from "@vercel/flags/next";
import { unstable_flag as flag } from "@vercel/flags/next";
import { getUserOrThrow } from "./nwd";
import posthog from "./posthog";

export const showAllocationTimeline: Flag<boolean> = flag({
  key: "allocation-timeline",
  async decide() {
    const key = this.key;
    const user = await getUserOrThrow();
    const flag = await posthog.getFeatureFlag(key, user.authUserId);

    return !!flag;
  },
  defaultValue: false,
  description: "Show the timeline on the allocation page",
  options: [
    {
      value: true,
      label: "With timeline",
    },
    {
      value: false,
      label: "Without timeline",
    },
  ],
});
