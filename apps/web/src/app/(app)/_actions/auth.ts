"use server";

import { AuthError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "~/lib/supabase/server";

export async function login(_prevState: unknown, formData: FormData) {
  let email: string;
  try {
    const supabase = createClient();

    email = z.string().email().parse(formData.get("email"));

    const { error } = await supabase.auth.signInWithOtp({ email, options: {} });

    if (error) {
      throw error;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.message };
    }

    console.error(error);

    return { error: "Er ging iets niet goed" };
  }

  redirect(`/login/code?email=${encodeURIComponent(email)}`);
}

export async function verify(
  email: string,
  _prevState: unknown,
  formData: FormData,
) {
  try {
    const supabase = createClient();

    const otp = z.coerce.string().length(6).parse(formData.get("otp"));

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      if (error instanceof AuthError) {
        return { error: error.message };
      }

      console.error(error);

      return { error: "Er ging iets niet goed" };
    }
  } catch (error) {}

  revalidatePath("/", "layout");
  redirect(`/`);
}

export async function logout() {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.message };
    }

    console.error(error);

    return { error: "Er ging iets niet goed" };
  }

  revalidatePath("/", "layout");
  redirect(`/`);
}
