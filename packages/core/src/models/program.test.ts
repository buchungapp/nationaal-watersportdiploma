import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../contexts/index.js'
import { createDegree } from './degree.js'
import { createDiscipline } from './discipline.js'
import { createProgram, listPrograms } from './program.js'

test('program crud', () =>
  withTestTransaction(async () => {
    const { id: disciplineId } = await createDiscipline({
      title: 'title-1',
      handle: 'handle-1',
    })

    const { id: degreeId } = await createDegree({
      title: 'title-1',
      handle: 'handle-1',
      rang: 1,
    })

    const { id } = await createProgram({
      title: 'title-1',
      handle: 'handle-1',
      degreeId,
      disciplineId,
    })

    const list = await listPrograms()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepEqual(item, {
      id,
      title: 'title-1',
      handle: 'handle-1',
    })
  }))
