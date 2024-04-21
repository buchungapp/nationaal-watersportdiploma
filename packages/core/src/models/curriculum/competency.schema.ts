import { z } from 'zod'

export const Schema = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string(),
  rang: z.number().int(),
})
