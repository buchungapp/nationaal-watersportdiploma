import { type Flag, flag } from "flags/next";
import { getUserOrThrow } from "./nwd";
import posthog from "./posthog";

export const showAllocationTimeline: Flag<boolean> = flag({
  key: "allocation-timeline",
  async decide() {
    if (process.env.NODE_ENV === "development") {
      return true;
    }

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

export const showProgressTracking: Flag<boolean> = flag({
  key: "progress-tracking",
  async decide({ entities }) {
    if (
      process.env.NODE_ENV === "development" ||
      entities?.location === "krekt-sailing"
    ) {
      return true;
    }

    const key = this.key;
    const user = await getUserOrThrow();
    const flag = await posthog.getFeatureFlag(key, user.authUserId);

    return !!flag;
  },
  defaultValue: false,
  description:
    "Show the progress tracking on the allocation page and person page",
  options: [
    {
      value: true,
      label: "With progress tracking",
    },
    {
      value: false,
      label: "Without progress tracking",
    },
  ],
});

export const showNewWaterSportCertificates: Flag<boolean> = flag({
  key: "water-sport-certificates",
  async decide() {
    if (process.env.NODE_ENV === "development") {
      return true;
    }

    const key = this.key;
    const user = await getUserOrThrow();
    const flag = await posthog.getFeatureFlag(key, user.authUserId);

    return !!flag;
  },
  defaultValue: false,
  description: "Show the new water sport certificates on the person page",
  options: [
    {
      value: true,
      label: "With water sport certificates",
    },
    {
      value: false,
      label: "Without water sport certificates",
    },
  ],
});

export const showNewLogBook: Flag<boolean> = flag({
  key: "logbook",
  async decide() {
    if (process.env.NODE_ENV === "development") {
      return true;
    }

    const key = this.key;
    const user = await getUserOrThrow();
    const flag = await posthog.getFeatureFlag(key, user.authUserId);

    return !!flag;
  },
  defaultValue: false,
  description: "Show the new logbook on the person page",
  options: [
    {
      value: true,
      label: "With logbook",
    },
    {
      value: false,
      label: "Without logbook",
    },
  ],
});
