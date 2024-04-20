import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import * as Module from './module.js'

test('module crud', () =>
  withTestTransaction(async () => {
    const { id } = await Module.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    const list = await Module.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, {
      id,
      title: 'title-1',
      handle: 'handle-1',
    })
  }))
