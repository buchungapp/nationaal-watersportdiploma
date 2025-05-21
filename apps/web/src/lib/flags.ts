// import { type Flag, flag } from "flags/next";
// import { getUserOrThrow } from "./nwd";
// import posthog from "./posthog";

// export const exampleFlagWithData: Flag<boolean> = flag({
//   key: "example-key",
//   async decide({ entities }) {
//     if (
//       process.env.NODE_ENV === "development" ||
//       entities?.location === "krekt-sailing"
//     ) {
//       return true;
//     }

//     const key = this.key;
//     const user = await getUserOrThrow();
//     const flag = await posthog.getFeatureFlag(key, user.authUserId);

//     return !!flag;
//   },
//   defaultValue: false,
//   description:
//   "Show example feature",
// options: [
//   {
//     value: true,
//     label: "With example feature",
//   },
//   {
//     value: false,
//     label: "Without example feature",
//   },
// ],
// });
