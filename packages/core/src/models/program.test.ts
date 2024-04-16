import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../contexts/index.js'
import * as Degree from './degree.js'
import * as Discipline from './discipline.js'
import * as Program from './program.js'

test('program crud', () =>
  withTestTransaction(async () => {
    const { id: disciplineId } = await Discipline.create({
      title: 'discipline-1',
      handle: 'dc1',
    })

    const { id: degreeId } = await Degree.create({
      title: 'degree-1',
      handle: 'dg1',
      rang: 1,
    })

    const { id } = await Program.create({
      title: 'program-1',
      handle: 'pr1',
      degreeId,
      disciplineId,
    })

    const list = await Program.list()

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
