"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { auth } from "~/lib/auth/server";
import { actionClientWithMeta } from "../safe-action";

const loginSchema = zfd.formData({
  email: zfd.text(z.string().email()),
});

export const loginAction = actionClientWithMeta
  .inputSchema(loginSchema)
  .metadata({
    name: "auth.login",
  })
  .action(async ({ parsedInput: data }) => {
    await auth().api.sendVerificationOTP({
      body: { email: data.email, type: "sign-in" },
      headers: await headers(),
    });

    redirect(`/login/code?email=${encodeURIComponent(data.email)}`);
  });
