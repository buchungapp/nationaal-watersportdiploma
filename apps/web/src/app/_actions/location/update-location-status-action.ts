"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateLocationStatus } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updateLocationStatusSchema = zfd.formData({
  status: zfd.text(z.enum(["draft", "hidden", "archived", "active"])),
});

const updateLocationStatusArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const updateLocationStatusAction = actionClientWithMeta
  .metadata({ name: "update-location-status" })
  .schema(updateLocationStatusSchema)
  .bindArgsSchemas(updateLocationStatusArgsSchema)
  .action(
    async ({ parsedInput: { status }, bindArgsParsedInputs: [locationId] }) => {
      await updateLocationStatus(locationId, status);

      revalidatePath("/", "layout");
      revalidateTag("locations");
    },
  );
