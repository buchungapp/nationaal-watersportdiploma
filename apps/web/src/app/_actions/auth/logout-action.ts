"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/lib/auth/server";
import { actionClientWithMeta } from "../safe-action";

export const logoutAction = actionClientWithMeta
  .metadata({
    name: "auth.logout",
  })
  .action(async () => {
    await auth().api.signOut({ headers: await headers() });

    redirect("/");
  });
