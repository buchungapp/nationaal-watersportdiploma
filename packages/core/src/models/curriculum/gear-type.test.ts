import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import * as GearType from './gear-type.js'
import { Output } from './gear-type.schema.js'

test('module crud', () =>
  withTestTransaction(async () => {
    const { id } = await GearType.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    const list = await GearType.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, {
      id,
      title: 'title-1',
      handle: 'handle-1',
      createdAt: item!.createdAt,
      updatedAt: item!.updatedAt,
      deletedAt: null,
    } satisfies Output)
  }))
