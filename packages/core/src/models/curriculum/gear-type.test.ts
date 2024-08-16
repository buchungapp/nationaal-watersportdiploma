import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import * as GearType from './gear-type.js'
import { Output } from './gear-type.schema.js'

test('gear type crud', () =>
  withTestTransaction(async () => {
    const { id } = await GearType.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    // From handle
    const gearTypeFromHandle = await GearType.fromHandle('handle-1')

    const output = {
      id,
      title: 'title-1',
      handle: 'handle-1',
      createdAt: gearTypeFromHandle!.createdAt,
      updatedAt: gearTypeFromHandle!.updatedAt,
      deletedAt: null,
    } satisfies Output

    assert.deepStrictEqual(gearTypeFromHandle, output)

    // From id
    const gearTypeFromId = await GearType.fromId(id)
    assert.deepStrictEqual(gearTypeFromId, output)

    // List
    const list = await GearType.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, output)

    // Update
    const updated = await GearType.update({
      id,
      title: 'title-2',
      handle: 'handle-2',
    })

    assert.strictEqual(updated.id, id)

    const gearTypeFromHandleAfterUpdate = await GearType.fromHandle('handle-2')
    const outputAfterUpdate = {
      id,
      title: 'title-2',
      handle: 'handle-2',
      createdAt: gearTypeFromHandle!.createdAt,
      updatedAt: gearTypeFromHandleAfterUpdate!.updatedAt,
      deletedAt: null,
    } satisfies Output

    assert.deepStrictEqual(gearTypeFromHandleAfterUpdate, outputAfterUpdate)
  }))
