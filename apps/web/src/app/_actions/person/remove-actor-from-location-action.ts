"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { dropActorForLocation } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const removeActorFromLocationSchema = zfd.formData({
  personId: zfd.text(z.string().uuid()),
  type: zfd.text(
    z.enum(["student", "instructor", "location_admin", "pvb_beoordelaar"]),
  ),
});

const removeActorFromLocationArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const removeActorFromLocationAction = actionClientWithMeta
  .metadata({
    name: "remove-actor-from-location",
  })
  .schema(removeActorFromLocationSchema)
  .bindArgsSchemas(removeActorFromLocationArgsSchema)
  .action(
    async ({
      parsedInput: { personId, type },
      bindArgsParsedInputs: [locationId],
    }) => {
      await dropActorForLocation({
        locationId,
        personId,
        type,
      });

      revalidatePath("/locatie/[location]/personen", "page");
      revalidatePath("/locatie/[location]/personen/[id]", "page");
    },
  );
