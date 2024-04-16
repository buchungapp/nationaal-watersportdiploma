import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../contexts/index.js'
import { createDegree, listDegrees } from './degree.js'

test('degree crud', () =>
  withTestTransaction(async () => {
    const { id } = await createDegree({
      title: 'title-1',
      handle: 'handle-1',
      rang: 1,
    })

    const list = await listDegrees()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepEqual(item, {
      id,
      title: 'title-1',
      handle: 'handle-1',
      rang: 1,
    })
  }))
