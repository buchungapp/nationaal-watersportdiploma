import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getDefaultPerson, getUserOrThrow } from "~/lib/nwd";

export async function GET(_request: NextRequest) {
  const user = await getUserOrThrow();

  const primaryPerson = getDefaultPerson(user);

  if (!primaryPerson) {
    redirect("/account");
  }

  redirect(`/profiel/${primaryPerson.handle}`);
}
