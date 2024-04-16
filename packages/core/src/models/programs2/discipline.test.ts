import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import { createDiscipline, listDisciplines } from './discipline.js'

test('discipline crud', () =>
  withTestTransaction(async () => {
    const { id } = await createDiscipline({
      title: 'title-1',
      handle: 'handle-1',
    })

    const list = await listDisciplines()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepEqual(item, {
      id,
      title: 'title-1',
      handle: 'handle-1',
    })
  }))
