"use server";

import { User, withSupabaseClient, withTransaction } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow, supabaseConfig } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

export const addLocationAdminAsSystemAdminAction = actionClientWithMeta
  .metadata({ name: "location.add-admin-as-system-admin" })
  .inputSchema(
    z.object({
      locationId: z.string().uuid(),
      personId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput: { locationId, personId } }) => {
    const user = await getUserOrThrow();
    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang");
    }

    await withSupabaseClient(supabaseConfig, async () => {
      await withTransaction(async () => {
        await User.Person.ensureLocationLinkForAdmin({
          personId,
          locationId,
        });

        await User.Actor.upsert({
          personId,
          locationId,
          type: "location_admin",
        });
      });
    });

    revalidatePath("/secretariaat/locaties", "page");
  });
