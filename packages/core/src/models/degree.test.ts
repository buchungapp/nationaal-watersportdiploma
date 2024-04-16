import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../contexts/index.js'
import * as Degree from './degree.js'

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

    assert.deepEqual(item, {
      id,
      title: 'title-1',
      handle: 'handle-1',
      rang: 1,
    })
  }))
