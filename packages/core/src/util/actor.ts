import { Context } from '@nawadi/lib/node'
import { z } from 'zod'

export const PublicActor = z.object({
  type: z.literal('public'),
  properties: z.object({}),
})
export type PublicActor = z.infer<typeof PublicActor>

export const AccountActor = z.object({
  type: z.literal('account'),
  properties: z.object({
    accountID: z.string().uuid(),
    email: z.string().email(),
  }),
})
export type AccountActor = z.infer<typeof AccountActor>

export const Actor = z.discriminatedUnion('type', [AccountActor, PublicActor])
export type Actor = z.infer<typeof Actor>

const ActorContext = Context.create<Actor>('actor')

export const useActor = ActorContext.use
export const withActor = ActorContext.with

export function assertActor<T extends Actor['type']>(type: T) {
  const actor = useActor()
  if (actor.type !== type) {
    throw new Error(`Expected actor type ${type}, got ${actor.type}`)
  }

  return actor as Extract<Actor, { type: T }>
}
