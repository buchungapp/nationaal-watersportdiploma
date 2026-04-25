import { Auth } from "@nawadi/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const auth = Auth.getBetterAuth;

async function currentSession() {
  const instance = Auth.getBetterAuth();
  return instance.api.getSession({ headers: await headers() });
}

export const getSession = cache(currentSession);

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
