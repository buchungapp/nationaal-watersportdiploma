"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { upsertActorForLocation } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const addActorToLocationSchema = zfd.formData({
  personId: zfd.text(z.string().uuid()),
  type: zfd.text(z.enum(["student", "instructor", "location_admin"])),
});

const addActorToLocationArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const addActorToLocationAction = actionClientWithMeta
  .metadata({
    name: "add-actor-to-location",
  })
  .schema(addActorToLocationSchema)
  .bindArgsSchemas(addActorToLocationArgsSchema)
  .action(
    async ({
      parsedInput: { personId, type },
      bindArgsParsedInputs: [locationId],
    }) => {
      await upsertActorForLocation({
        locationId,
        personId,
        type,
      });

      revalidatePath("/locatie/[location]/personen", "page");
      revalidatePath("/locatie/[location]/personen/[id]", "page");
    },
  );
