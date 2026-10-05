"use server";

import { Location, withSupabaseClient } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow, supabaseConfig } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const createLocationSchema = z.object({
  name: z.string().trim().min(1, "Naam is verplicht"),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Handle moet minimaal 3 tekens zijn")
    .max(48, "Handle mag maximaal 48 tekens zijn")
    .regex(
      /^[a-z0-9-]+$/,
      "Handle mag alleen kleine letters, cijfers en streepjes bevatten",
    ),
  websiteUrl: z
    .string()
    .trim()
    .url("Ongeldige URL")
    .optional()
    .or(z.literal("")),
});

export const createLocationAsSystemAdminAction = actionClientWithMeta
  .metadata({ name: "location.create-as-system-admin" })
  .inputSchema(createLocationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getUserOrThrow();
    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang");
    }

    const websiteUrl =
      parsedInput.websiteUrl && parsedInput.websiteUrl.length > 0
        ? parsedInput.websiteUrl
        : undefined;

    const result = await withSupabaseClient(supabaseConfig, async () => {
      return Location.Onboarding.createForOnboarding({
        name: parsedInput.name,
        handle: parsedInput.handle,
        websiteUrl,
      });
    });

    revalidatePath("/secretariaat/locaties", "page");

    return { id: result.id };
  });
