import { useQuery } from '@nawadi/core'
import { schema as s } from '@nawadi/db'

export const LOCATION_ID = 'dfcbd21d-285a-4caa-b0c9-168061bf2156'

export async function addLocation() {
  const query = useQuery()
  await query.insert(s.location).values({
    id: LOCATION_ID,
    handle: 'zeilschool-de-optimist',
    name: 'Zeilschool de Optimist',
    websiteUrl: 'https://www.zeilschool-deoptimist.nl',
    _metadata: {
      socialMedia: [
        {
          url: 'about:blank',
          platform: 'facebook',
        },
        {
          url: 'about:blank',
          platform: 'instagram',
        },
        {
          url: 'about:blank',
          platform: 'tiktok',
        },
        {
          url: 'about:blank',
          platform: 'youtube',
        },
      ],
    },
    status: 'active',
  })
}
