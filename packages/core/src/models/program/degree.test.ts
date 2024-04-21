import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import * as Degree from './degree.js'
import { Output } from './degree.schema.js'

test('degree crud', () =>
  withTestTransaction(async () => {
    const { id } = await Degree.create({
      title: 'title-1',
      handle: 'handle-1',
      rang: 1,
    })

    const list = await Degree.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, {
      id,
      title: 'title-1',
      handle: 'handle-1',
      rang: 1,
      createdAt: item!.createdAt,
      updatedAt: item!.updatedAt,
      deletedAt: null,
    } satisfies Output)
  }))
