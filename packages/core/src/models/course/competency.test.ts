import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import * as Competency from './competency.js'
import { Output } from './competency.schema.js'

test('competency crud', () =>
  withTestTransaction(async () => {
    const { id } = await Competency.create({
      title: 'title-1',
      handle: 'handle-1',
      type: 'knowledge',
    })

    // From handle
    const competencyFromHandle = await Competency.fromHandle('handle-1')

    const output = {
      id,
      title: 'title-1',
      handle: 'handle-1',
      type: 'knowledge',
      createdAt: competencyFromHandle!.createdAt,
      updatedAt: competencyFromHandle!.updatedAt,
      deletedAt: null,
      weight: 1,
    } satisfies Output

    assert.deepStrictEqual(competencyFromHandle, output)

    // List
    const list = await Competency.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, output)

    // Update
    const updated = await Competency.update({
      id,
      title: 'title-2',
      handle: 'handle-2',
      weight: 2,
      type: 'skill',
    })

    assert.strictEqual(updated.id, id)

    const competencyFromHandleAfterUpdate =
      await Competency.fromHandle('handle-2')
    const outputAfterUpdate = {
      id,
      title: 'title-2',
      handle: 'handle-2',
      createdAt: competencyFromHandle!.createdAt,
      updatedAt: competencyFromHandleAfterUpdate!.updatedAt,
      deletedAt: null,
      weight: 2,
      type: 'skill',
    } satisfies Output

    assert.deepStrictEqual(competencyFromHandleAfterUpdate, outputAfterUpdate)
  }))
