"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SocialPlatform } from "~/lib/nwd";
import { updateLocationDetails } from "~/lib/nwd";

export async function updateSettings(
  locationId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    name: z.string().min(1),
    websiteUrl: z.string().url(),
    email: z.string().email(),
    shortDescription: z
      .string()
      .optional()
      .transform((v) => {
        // If empty string, transform to null
        if (v === "") {
          return null;
        }
        return v;
      }),
  });

  try {
    const parsed = expectedSchema.parse(Object.fromEntries(formData.entries()));

    await updateLocationDetails(locationId, {
      ...parsed,
    });

    revalidatePath("/locatie/[location]", "layout");

    return {
      message: "Success",
      errors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    return {
      message: "Error",
      errors: {},
    };
  }
}

export async function updateSocials(
  locationId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    googlePlaceId: z
      .string()
      .optional()
      .transform((v) => {
        // If empty string, transform to null
        if (v === "") {
          return null;
        }
        return v;
      }),
    "socials-facebook": z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().url().optional(),
    ),
    "socials-instagram": z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().url().optional(),
    ),
    "socials-linkedin": z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().url().optional(),
    ),
    "socials-tiktok": z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().url().optional(),
    ),
    "socials-whatsapp": z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().url().optional(),
    ),
    "socials-x": z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().url().optional(),
    ),
    "socials-youtube": z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().url().optional(),
    ),
  });

  try {
    const parsed = expectedSchema.parse(Object.fromEntries(formData.entries()));

    const data = {
      socialMedia: Object.entries(parsed)
        .filter(
          ([key]) =>
            key.startsWith("socials-") &&
            !!parsed[key as keyof typeof parsed] &&
            parsed[key as keyof typeof parsed] !== "",
        )
        .map(([key, url]) => ({
          platform: key.replace("socials-", "") as SocialPlatform,
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          url: url!,
        })),
      googlePlaceId: parsed.googlePlaceId,
    };

    await updateLocationDetails(locationId, data);

    revalidatePath("/locatie/[location]/instellingen", "page");

    return {
      message: "Success",
      errors: {},
    };
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    return {
      message: "Error",
      errors: {},
    };
  }
}
