"use server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateLocationResources } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updateLocationResourcesSchema = zfd.formData({
  gearTypes: z
    .record(z.string().uuid(), zfd.checkbox())
    .transform((x) => Object.keys(x).filter((key) => x[key]))
    .default({}),
  disciplines: z
    .record(z.string().uuid(), zfd.checkbox())
    .transform((x) => Object.keys(x).filter((key) => x[key]))
    .default({}),
});

const updateLocationResourcesArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const updateLocationResourcesAction = actionClientWithMeta
  .metadata({ name: "update-location-resources" })
  .inputSchema(updateLocationResourcesSchema)
  .bindArgsSchemas(updateLocationResourcesArgsSchema)
  .action(
    async ({
      parsedInput: { gearTypes, disciplines },
      bindArgsParsedInputs: [locationId],
    }) => {
      await updateLocationResources(locationId, { gearTypes, disciplines });
      revalidateTag(`${locationId}-resource-link`, { expire: 0 });
    },
  );
