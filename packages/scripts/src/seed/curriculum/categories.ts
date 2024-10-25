import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'

export const AGE_CATEGORY_ID = 'c9439c5b-1136-4fee-bd28-14a599f2c081'
export const JEUGD_CATEGORY_ID = '350d19cf-b9ae-4801-ba0d-7c54ec5734ef'
export const JONGEREN_CATEGORY_ID = 'aca22387-b7a8-4954-b99b-286c041daa87'
export const VOLWASSENEN_CATEGORY_ID = 'f0f4f7b4-3f4d-4e5a-9b5d-4f7d5b7a4f5b'

export async function addCategories() {
  const query = useQuery()

  await query.insert(s.category).values([
    {
      id: AGE_CATEGORY_ID,
      handle: 'leeftijdscategorie',
      title: 'Leeftijdscategorie',
      weight: 1,
    },
    {
      id: JEUGD_CATEGORY_ID,
      parentCategoryId: AGE_CATEGORY_ID,
      handle: 'jeugd',
      title: 'Jeugd',
      weight: 2,
    },
    {
      id: JONGEREN_CATEGORY_ID,
      parentCategoryId: AGE_CATEGORY_ID,
      handle: 'jongeren',
      title: 'Jongeren',
      weight: 2,
    },
    {
      id: VOLWASSENEN_CATEGORY_ID,
      parentCategoryId: AGE_CATEGORY_ID,
      handle: 'volwassenen',
      title: 'Volwassenen',
      weight: 2,
    },
  ])
}
