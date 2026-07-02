"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  createIntegrationApiKeyForLocation,
  revokeIntegrationApiKeyForLocation,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const locationArgsSchema: [
  locationId: z.ZodString,
  locationHandle: z.ZodString,
] = [z.string().uuid(), z.string().min(1)];

export const createIntegrationApiKeyAction = actionClientWithMeta
  .metadata({ name: "location.integration-api-key.create" })
  .inputSchema(
    zfd.formData({
      name: zfd.text(z.string().trim().min(2).max(80)),
    }),
  )
  .bindArgsSchemas(locationArgsSchema)
  .action(
    async ({
      parsedInput,
      bindArgsParsedInputs: [locationId, locationHandle],
    }) => {
      const apiKey = await createIntegrationApiKeyForLocation(locationId, {
        name: parsedInput.name,
      });

      revalidatePath(`/locatie/${locationHandle}/instellingen`);

      return apiKey;
    },
  );

export const revokeIntegrationApiKeyAction = actionClientWithMeta
  .metadata({ name: "location.integration-api-key.revoke" })
  .inputSchema(
    z.object({
      apiKeyId: z.string().uuid(),
    }),
  )
  .bindArgsSchemas(locationArgsSchema)
  .action(
    async ({
      parsedInput,
      bindArgsParsedInputs: [locationId, locationHandle],
    }) => {
      await revokeIntegrationApiKeyForLocation(
        locationId,
        parsedInput.apiKeyId,
      );

      revalidatePath(`/locatie/${locationHandle}/instellingen`);
    },
  );
