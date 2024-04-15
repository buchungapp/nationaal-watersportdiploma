import { node } from '@nawadi/lib'
import { z } from 'zod'

export const PublicActor = z.object({
  type: z.literal('public'),
  properties: z.object({}),
})
export type PublicActor = z.infer<typeof PublicActor>

export const AccountActor = z.object({
  type: z.literal('account'),
  properties: z.object({
    accountId: z.string().uuid(),
    email: z.string().email(),
  }),
})
export type AccountActor = z.infer<typeof AccountActor>

export const UserActor = z.object({
  type: z.literal('user'),
  properties: z.object({
    userId: z.string().uuid(),
    locationId: z.string().uuid().optional(),
  }),
})
export type UserActor = z.infer<typeof UserActor>

export const SystemActor = z.object({
  type: z.literal('system'),
  properties: z.object({
    locationId: z.string().uuid().optional(),
  }),
})
export type SystemActor = z.infer<typeof SystemActor>

export const Actor = z.discriminatedUnion('type', [
  UserActor,
  AccountActor,
  PublicActor,
  SystemActor,
])
export type Actor = z.infer<typeof Actor>

const ActorContext = node.Context.create<Actor>('actor')

export const useActor = ActorContext.use
export const withActor = ActorContext.with

export function assertActor<T extends Actor['type']>(type: T) {
  const actor = useActor()
  if (actor.type !== type) {
    throw new Error(`Expected actor type ${type}, got ${actor.type}`)
  }

  return actor as Extract<Actor, { type: T }>
}
