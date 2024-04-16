import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import { createDegree } from './degree.js'
import { createDiscipline } from './discipline.js'
import { createProgram, listPrograms } from './program.js'

test('program crud', () =>
  withTestTransaction(async () => {
    const { id: disciplineId } = await createDiscipline({
      title: 'discipline-1',
      handle: 'dc1',
    })

    const { id: degreeId } = await createDegree({
      title: 'degree-1',
      handle: 'dg1',
      rang: 1,
    })

    const { id } = await createProgram({
      title: 'program-1',
      handle: 'pr1',
      degreeId,
      disciplineId,
    })

    const list = await listPrograms()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepEqual(item, {
      id,
      title: 'program-1',
      handle: 'pr1',

      disciplineId,
      disciplineTitle: 'discipline-1',

      degreeId,
      degreeTitle: 'degree-1',
    })
  }))
