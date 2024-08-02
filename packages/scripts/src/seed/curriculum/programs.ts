import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'
import {
  COURSE_JEUGD_ID,
  COURSE_JONGEREN_ID,
  COURSE_VOLWASSENEN_ID,
} from './courses.js'
import {
  DEGREE_LEVEL_1_ID,
  DEGREE_LEVEL_2_ID,
  DEGREE_LEVEL_3_ID,
  DEGREE_LEVEL_4_ID,
} from './degrees.js'

export const PROGRAM_ZWAARDBOOT_1_MANS_JEUGD_1_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15464'
export const PROGRAM_ZWAARDBOOT_1_MANS_JEUGD_2_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15465'
export const PROGRAM_ZWAARDBOOT_1_MANS_JEUGD_3_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15466'
export const PROGRAM_ZWAARDBOOT_1_MANS_JEUGD_4_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15467'

export const PROGRAM_ZWAARDBOOT_1_MANS_JONGEREN_1_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15468'
export const PROGRAM_ZWAARDBOOT_1_MANS_JONGEREN_2_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15469'
export const PROGRAM_ZWAARDBOOT_1_MANS_JONGEREN_3_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15470'
export const PROGRAM_ZWAARDBOOT_1_MANS_JONGEREN_4_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15471'

export const PROGRAM_ZWAARDBOOT_1_MANS_VOLWASSENEN_1_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15472'
export const PROGRAM_ZWAARDBOOT_1_MANS_VOLWASSENEN_2_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15473'
export const PROGRAM_ZWAARDBOOT_1_MANS_VOLWASSENEN_3_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15474'
export const PROGRAM_ZWAARDBOOT_1_MANS_VOLWASSENEN_4_ID =
  'da921204-1b92-42a8-a3d0-80d18ea15475'

export async function addPrograms() {
  const query = useQuery()

  await query.insert(s.program).values([
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_JEUGD_1_ID,
      handle: 'zwaardboot-1-mans-jeugd-1',
      title: 'Zwaardboot 1-mans Jeugd 1',
      courseId: COURSE_JEUGD_ID,
      degreeId: DEGREE_LEVEL_1_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_JEUGD_2_ID,
      handle: 'zwaardboot-1-mans-jeugd-2',
      title: 'Zwaardboot 1-mans Jeugd 2',
      courseId: COURSE_JEUGD_ID,
      degreeId: DEGREE_LEVEL_2_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_JEUGD_3_ID,
      handle: 'zwaardboot-1-mans-jeugd-3',
      title: 'Zwaardboot 1-mans Jeugd 3',
      courseId: COURSE_JEUGD_ID,
      degreeId: DEGREE_LEVEL_3_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_JEUGD_4_ID,
      handle: 'zwaardboot-1-mans-jeugd-4',
      title: 'Zwaardboot 1-mans Jeugd 4',
      courseId: COURSE_JEUGD_ID,
      degreeId: DEGREE_LEVEL_4_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_JONGEREN_1_ID,
      handle: 'zwaardboot-1-mans-jongeren-1',
      title: 'Zwaardboot 1-mans Jongeren 1',
      courseId: COURSE_JONGEREN_ID,
      degreeId: DEGREE_LEVEL_1_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_JONGEREN_2_ID,
      handle: 'zwaardboot-1-mans-jongeren-2',
      title: 'Zwaardboot 1-mans Jongeren 2',
      courseId: COURSE_JONGEREN_ID,
      degreeId: DEGREE_LEVEL_2_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_JONGEREN_3_ID,
      handle: 'zwaardboot-1-mans-jongeren-3',
      title: 'Zwaardboot 1-mans Jongeren 3',
      courseId: COURSE_JONGEREN_ID,
      degreeId: DEGREE_LEVEL_3_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_JONGEREN_4_ID,
      handle: 'zwaardboot-1-mans-jongeren-4',
      title: 'Zwaardboot 1-mans Jongeren 4',
      courseId: COURSE_JONGEREN_ID,
      degreeId: DEGREE_LEVEL_4_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_VOLWASSENEN_1_ID,
      handle: 'zwaardboot-1-mans-volwassenen-1',
      title: 'Zwaardboot 1-mans Volwassenen 1',
      courseId: COURSE_VOLWASSENEN_ID,
      degreeId: DEGREE_LEVEL_1_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_VOLWASSENEN_2_ID,
      handle: 'zwaardboot-1-mans-volwassenen-2',
      title: 'Zwaardboot 1-mans Volwassenen 2',
      courseId: COURSE_VOLWASSENEN_ID,
      degreeId: DEGREE_LEVEL_2_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_VOLWASSENEN_3_ID,
      handle: 'zwaardboot-1-mans-volwassenen-3',
      title: 'Zwaardboot 1-mans Volwassenen 3',
      courseId: COURSE_VOLWASSENEN_ID,
      degreeId: DEGREE_LEVEL_3_ID,
    },
    {
      id: PROGRAM_ZWAARDBOOT_1_MANS_VOLWASSENEN_4_ID,
      handle: 'zwaardboot-1-mans-volwassenen-4',
      title: 'Zwaardboot 1-mans Volwassenen 4',
      courseId: COURSE_VOLWASSENEN_ID,
      degreeId: DEGREE_LEVEL_4_ID,
    },
  ])
}
