"use server";

import { User } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { getUserOrThrow } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const setActingProfileSchema = z.object({
  locationId: zfd.text(z.string().uuid()),
  personId: zfd.text(z.string().uuid()),
});

export const setActingProfileForLocationAction = actionClientWithMeta
  .metadata({ name: "set-acting-profile-for-location" })
  .inputSchema(setActingProfileSchema)
  .action(async ({ parsedInput: { locationId, personId } }) => {
    const user = await getUserOrThrow();

    // Re-derive eligibility directly — never trust the client, and never
    // rely on the (request-scoped) resolver here. The person must be owned
    // by the user AND have an active location_admin/instructor actor at the
    // location.
    const owned = user.persons.some((p) => p.id === personId);
    if (!owned) {
      throw new Error("Unauthorized");
    }

    const roles = await User.Person.listActiveRolesForLocation({
      personId,
      locationId,
    });

    const isEligible =
      roles.includes("location_admin") || roles.includes("instructor");
    if (!isEligible) {
      throw new Error("Unauthorized");
    }

    await User.ActingProfile.setActingProfilePreference({
      userId: user.authUserId,
      locationId,
      personId,
    });

    revalidatePath("/locatie", "layout");
  });
