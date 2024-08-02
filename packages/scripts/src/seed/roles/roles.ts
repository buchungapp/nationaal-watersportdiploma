import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'
import {
  PRIVILEGE_MANAGE_COHORT_CERTIFICATE_ID,
  PRIVILEGE_MANAGE_COHORT_INSTRUCTORS_ID,
  PRIVILEGE_MANAGE_COHORT_STUDENTS_ID,
} from './privileges.js'

export const ROLE_COHORT_ADMIN_ID = '0a894562-9940-437d-a190-351bdd08f723'

export async function addRoles() {
  const query = useQuery()

  await query.insert(s.role).values({
    id: ROLE_COHORT_ADMIN_ID,
    handle: 'cohort_admin',
    title: 'Cohort Beheerder',
    type: 'cohort',
  })

  await query.insert(s.rolePrivilege).values([
    {
      roleId: ROLE_COHORT_ADMIN_ID,
      privilegeId: PRIVILEGE_MANAGE_COHORT_CERTIFICATE_ID,
    },
    {
      roleId: ROLE_COHORT_ADMIN_ID,
      privilegeId: PRIVILEGE_MANAGE_COHORT_INSTRUCTORS_ID,
    },
    {
      roleId: ROLE_COHORT_ADMIN_ID,
      privilegeId: PRIVILEGE_MANAGE_COHORT_STUDENTS_ID,
    },
  ])
}
