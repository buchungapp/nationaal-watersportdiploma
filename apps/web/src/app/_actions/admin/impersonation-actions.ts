"use server";

import { User } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertCanUseImpersonation } from "~/lib/impersonation";
import {
  getUserOrThrow,
  startImpersonation,
  stopImpersonation,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const impersonateSchema = z.object({
  targetUserId: z.string().uuid(),
});

const impersonatePersonSchema = z.object({
  personId: z.string().uuid(),
});

export const startImpersonationAction = actionClientWithMeta
  .metadata({ name: "start-impersonation" })
  .inputSchema(impersonateSchema)
  .action(async ({ parsedInput: { targetUserId } }) => {
    await startImpersonation(targetUserId);
    revalidatePath("/", "layout");
  });

export const startPersonImpersonationAction = actionClientWithMeta
  .metadata({ name: "start-person-impersonation" })
  .inputSchema(impersonatePersonSchema)
  .action(async ({ parsedInput: { personId } }) => {
    const user = await getUserOrThrow();
    assertCanUseImpersonation(user.email);

    const persons = await User.Person.list({
      filter: { personId },
      limit: 1,
    });
    const person = persons.items[0];

    if (!person) {
      throw new Error("Persoon niet gevonden.");
    }

    if (!person.userId) {
      throw new Error("Deze persoon heeft geen gekoppeld account.");
    }

    await startImpersonation(person.userId);
    revalidatePath("/", "layout");
  });

export const stopImpersonationAction = actionClientWithMeta
  .metadata({ name: "stop-impersonation" })
  .inputSchema(z.object({}))
  .action(async () => {
    await stopImpersonation();
    revalidatePath("/", "layout");
  });
