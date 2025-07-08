export function formatPersonName(person: {
  firstName?: string | null;
  lastNamePrefix?: string | null;
  lastName?: string | null;
}) {
  const parts = [];
  if (person.firstName) parts.push(person.firstName);
  if (person.lastNamePrefix) parts.push(person.lastNamePrefix);
  if (person.lastName) parts.push(person.lastName);
  return parts.join(" ");
}
