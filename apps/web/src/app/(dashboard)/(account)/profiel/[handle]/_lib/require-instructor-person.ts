import "server-only";
import { notFound } from "next/navigation";
import {
  getPersonByHandle,
  getUserOrThrow,
  listActiveActorTypesForPerson,
} from "~/lib/nwd";

// Role gate for instructor-only features under /profiel/[handle]/*.
//
// The gate is: the handle resolves to a person owned by the current
// user (ownership enforced by getPersonByHandle) with an active
// instructor-ish role — instructor, pvb_beoordelaar, or location_admin.
//
// Returns the loaded user + person so pages can reuse them without
// a second roundtrip. Calls notFound() on any failure — we don't
// leak whether the handle exists or the role just isn't right.

export type InstructorPersonContext = {
  user: Awaited<ReturnType<typeof getUserOrThrow>>;
  person: Awaited<ReturnType<typeof getPersonByHandle>>;
};

/**
 * Require that the handle resolves to a person owned by the current
 * user (ownership enforced by getPersonByHandle) with an active
 * instructor-ish role. Any failure → notFound().
 */
export async function requireInstructorPerson(
  handle: string,
): Promise<InstructorPersonContext> {
  const user = await getUserOrThrow();
  const person = await getPersonByHandle(handle);

  // Ensure the person belongs to this user. getPersonByHandle already
  // enforces ownership — if the handle isn't one of the user's, the
  // helper throws. Defensive check here is belt-and-braces.
  if (!user.persons.some((p) => p.id === person.id)) {
    notFound();
  }

  const roles = await listActiveActorTypesForPerson(person.id);
  const isActiveInstructor = (
    ["instructor", "pvb_beoordelaar", "location_admin"] as const
  ).some((role) => roles.includes(role));

  if (!isActiveInstructor) {
    notFound();
  }

  return { user, person };
}
