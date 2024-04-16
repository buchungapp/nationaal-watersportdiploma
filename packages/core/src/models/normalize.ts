import { isComponentsHandle } from '@nawadi/api'
import assert from 'assert'

export function normalizeHandle(value: string) {
  value = value.trim()

  assert(isComponentsHandle(value))

  return value
}

export function normalizeTitle(value: string) {
  value = value.trim()

  return value
}

export function normalizeRang(value: number) {
  assert(value > 0)

  return value
}
