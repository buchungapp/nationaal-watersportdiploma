import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import * as Discipline from './discipline.js'
import { Output } from './discipline.schema.js'

test('discipline crud', () =>
  withTestTransaction(async () => {
    const { id } = await Discipline.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    // From handle
    const disciplineFromHandle = await Discipline.fromHandle('handle-1')

    const output = {
      id,
      title: 'title-1',
      handle: 'handle-1',
      createdAt: disciplineFromHandle!.createdAt,
      updatedAt: disciplineFromHandle!.updatedAt,
      deletedAt: null,
      weight: 1,
    } satisfies Output

    assert.deepStrictEqual(disciplineFromHandle, output)

    // From id
    const disciplineFromId = await Discipline.fromId(id)
    assert.deepStrictEqual(disciplineFromId, output)

    // List
    const list = await Discipline.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, output)

    // Update
    const updated = await Discipline.update({
      id,
      title: 'title-2',
      handle: 'handle-2',
      weight: 2,
    })

    assert.strictEqual(updated.id, id)

    const disciplineFromHandleAfterUpdate =
      await Discipline.fromHandle('handle-2')
    const outputAfterUpdate = {
      id,
      title: 'title-2',
      handle: 'handle-2',
      createdAt: disciplineFromHandle!.createdAt,
      updatedAt: disciplineFromHandleAfterUpdate!.updatedAt,
      deletedAt: null,
      weight: 2,
    } satisfies Output

    assert.deepStrictEqual(disciplineFromHandleAfterUpdate, outputAfterUpdate)
  }))
