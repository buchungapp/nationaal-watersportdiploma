"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { createClient } from "~/lib/supabase/server";
import { actionClientWithMeta } from "../safe-action";

const verifySchema = zfd.formData({
  otp: zfd.text(z.coerce.string().length(6)),
});

const verifyArgsSchema: [email: z.ZodString] = [z.string().email()];

export const verifyAction = actionClientWithMeta
  .schema(verifySchema)
  .metadata({
    name: "auth.verify",
  })
  .bindArgsSchemas(verifyArgsSchema)
  .action(async ({ parsedInput: data, bindArgsParsedInputs: [email] }) => {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: data.otp,
      type: "email",
    });

    if (error) {
      throw error;
    }

    revalidatePath("/", "layout");
    redirect("/profiel?_cacheBust=1");
  });
