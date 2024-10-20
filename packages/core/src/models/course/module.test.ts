import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import * as Module from './module.js'
import { Output } from './module.schema.js'

test('module crud', () =>
  withTestTransaction(async () => {
    const { id } = await Module.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    // From handle
    const moduleFromHandle = await Module.fromHandle('handle-1')

    const output = {
      id,
      title: 'title-1',
      handle: 'handle-1',
      createdAt: moduleFromHandle!.createdAt,
      updatedAt: moduleFromHandle!.updatedAt,
      deletedAt: null,
      weight: 1,
    } satisfies Output

    assert.deepStrictEqual(moduleFromHandle, output)

    // List
    const list = await Module.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, output)

    // Update
    const updated = await Module.update({
      id,
      title: 'title-2',
      handle: 'handle-2',
      weight: 2,
    })

    assert.strictEqual(updated.id, id)

    const moduleFromHandleAfterUpdate = await Module.fromHandle('handle-2')
    const outputAfterUpdate = {
      id,
      title: 'title-2',
      handle: 'handle-2',
      createdAt: moduleFromHandle!.createdAt,
      updatedAt: moduleFromHandleAfterUpdate!.updatedAt,
      deletedAt: null,
      weight: 2,
    } satisfies Output

    assert.deepStrictEqual(moduleFromHandleAfterUpdate, outputAfterUpdate)
  }))
