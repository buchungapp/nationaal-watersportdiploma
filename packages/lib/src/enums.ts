import { z } from 'zod'

export const Privilege = z.enum([
  'manage_cohort_certificate',
  'manage_cohort_students',
  'manage_cohort_instructors',
])
