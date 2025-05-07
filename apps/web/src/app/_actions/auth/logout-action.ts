"use server";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { actionClientWithMeta } from "../safe-action";

export const logoutAction = actionClientWithMeta
  .metadata({
    name: "auth.logout",
  })
  .action(async () => {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    redirect("/");
  });
