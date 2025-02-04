import { useQuery } from "@nawadi/core";
import { schema as s } from "@nawadi/db";

export const PRIVILEGE_MANAGE_COHORT_CERTIFICATE_ID =
  "63a4ef59-8550-4ee8-a3bd-11c8b6a78b9e";
export const PRIVILEGE_MANAGE_COHORT_INSTRUCTORS_ID =
  "63a4ef59-8550-4ee8-a3bd-11c8b6a78b9f";
export const PRIVILEGE_MANAGE_COHORT_STUDENTS_ID =
  "63a4ef59-8550-4ee8-a3bd-11c8b6a78b92";

export async function addPrivileges() {
  const query = useQuery();

  await query.insert(s.privilege).values([
    {
      id: PRIVILEGE_MANAGE_COHORT_CERTIFICATE_ID,
      handle: "manage_cohort_certificate",
      description: "Kan diploma's accorderen.",
    },
    {
      id: PRIVILEGE_MANAGE_COHORT_INSTRUCTORS_ID,
      handle: "manage_cohort_instructors",
      description: "Kan instructeurs in het cohort beheren.",
    },
    {
      id: PRIVILEGE_MANAGE_COHORT_STUDENTS_ID,
      handle: "manage_cohort_students",
      description: "Kan cursisten in het cohort beheren.",
    },
  ]);
}
