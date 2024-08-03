import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'
import {
  JEUGD_CATEGORY_ID,
  JONGEREN_CATEGORY_ID,
  VOLWASSENEN_CATEGORY_ID,
} from './categories.js'
import { DISCIPLINE_ZWAARDBOOT_1_MANS_ID } from './disciplines.js'

export const COURSE_JEUGD_ID = '504f5f9c-ead5-4fc6-b0d3-4003a684e5e6'
export const COURSE_JONGEREN_ID = '134bca7f-b382-43d1-8de2-6a08931429ff'
export const COURSE_VOLWASSENEN_ID = '2fceda57-25b2-4a20-9af8-ad4f525e5179'

export async function addCourses() {
  const query = useQuery()

  await query.insert(s.course).values([
    {
      id: COURSE_JEUGD_ID,
      handle: 'zwaardboot-1-mans-jeugd',
      title: 'Zwaardboot 1-mans Jeugd',
      disciplineId: DISCIPLINE_ZWAARDBOOT_1_MANS_ID,
    },
    {
      id: COURSE_JONGEREN_ID,
      handle: 'zwaardboot-1-mans-jongeren',
      title: 'Zwaardboot 1-mans Jongeren',
      disciplineId: DISCIPLINE_ZWAARDBOOT_1_MANS_ID,
    },
    {
      id: COURSE_VOLWASSENEN_ID,
      handle: 'zwaardboot-1-mans-volwassenen',
      title: 'Zwaardboot 1-mans Volwassenen',
      disciplineId: DISCIPLINE_ZWAARDBOOT_1_MANS_ID,
    },
  ])

  await query.insert(s.courseCategory).values([
    {
      courseId: COURSE_JEUGD_ID,
      categoryId: JEUGD_CATEGORY_ID,
    },
    {
      courseId: COURSE_JONGEREN_ID,
      categoryId: JONGEREN_CATEGORY_ID,
    },
    {
      courseId: COURSE_VOLWASSENEN_ID,
      categoryId: VOLWASSENEN_CATEGORY_ID,
    },
  ])
}
