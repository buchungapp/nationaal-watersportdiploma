type ProfilePerson = {
  handle: string;
  isPrimary: boolean;
};

export function getProfileRedirectPath(
  persons: readonly ProfilePerson[],
): `/profiel/${string}` | "/account" {
  const primaryPerson = persons.find((person) => person.isPrimary);

  return primaryPerson ? `/profiel/${primaryPerson.handle}` : "/account";
}
