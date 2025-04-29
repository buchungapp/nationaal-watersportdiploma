"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { createClient } from "~/lib/supabase/server";
import { actionClientWithMeta } from "../safe-action";

const loginSchema = zfd.formData({
  email: zfd.text(z.string().email()),
});

export const loginAction = actionClientWithMeta
  .schema(loginSchema)
  .metadata({
    name: "auth.login",
  })
  .action(async ({ parsedInput: data }) => {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({ email: data.email });

    if (error) {
      throw error;
    }

    redirect(`/login/code?email=${encodeURIComponent(data.email)}`);
  });
