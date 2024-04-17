import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../contexts/index.js'
import * as Discipline from './discipline.js'

test('discipline crud', () =>
  withTestTransaction(async () => {
    const { id } = await Discipline.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    const list = await Discipline.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepEqual(item, {
      id,
      title: 'title-1',
      handle: 'handle-1',
    })
  }))
