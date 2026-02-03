import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getUserOrThrow } from "~/lib/nwd";

export async function GET(_request: NextRequest) {
  const user = await getUserOrThrow();

  const primaryPerson = user.persons.find((person) => person.isPrimary);

  if (!primaryPerson) {
    redirect("/account");
  }

  redirect(`/profiel/${primaryPerson.handle}`);
}
