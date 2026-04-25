"use server";
import { Auth } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { auth } from "~/lib/auth/server";
import { actionClientWithMeta } from "../safe-action";

const verifySchema = zfd.formData({
  otp: zfd.text(z.coerce.string().length(6)),
});

const verifyArgsSchema: [email: z.ZodString] = [z.string().email()];

export const verifyAction = actionClientWithMeta
  .inputSchema(verifySchema)
  .metadata({
    name: "auth.verify",
  })
  .bindArgsSchemas(verifyArgsSchema)
  .action(async ({ parsedInput: data, bindArgsParsedInputs: [email] }) => {
    await auth().api.signInEmailOTP({
      body: { email, otp: data.otp },
      headers: await headers(),
    });

    await Auth.getOrCreateUser({ email });

    revalidatePath("/", "layout");
    redirect("/profiel?_cacheBust=1");
  });
