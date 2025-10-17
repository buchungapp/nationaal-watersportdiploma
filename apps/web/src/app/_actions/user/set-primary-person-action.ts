"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { setPrimaryPersonForUser } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const setPrimaryPersonSchema = z.object({
  personId: zfd.text(z.string().uuid()),
});

const setPrimaryPersonForUserArgsSchema: [userId: z.ZodOptional<z.ZodString>] =
  [z.string().uuid().optional()];

export const setPrimaryPersonForUserAction = actionClientWithMeta
  .metadata({ name: "set-primary-person-for-user" })
  .schema(setPrimaryPersonSchema)
  .bindArgsSchemas(setPrimaryPersonForUserArgsSchema)
  .action(
    async ({ parsedInput: { personId }, bindArgsParsedInputs: [userId] }) => {
      await setPrimaryPersonForUser(personId, userId);

      revalidatePath("/", "page");
    },
  );
