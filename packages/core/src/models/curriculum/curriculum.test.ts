import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import dayjs from '../../util/dayjs.js'
import { Program } from '../index.js'
import { Degree, Discipline } from '../program/index.js'
import * as Curriculum from './curriculum.js'

test('curriculum crud', () =>
  withTestTransaction(async () => {
    const createDiscipline = Discipline.create({
      title: 'discipline-1',
      handle: 'dc1',
    })

    const createDegree = Degree.create({
      title: 'degree-1',
      handle: 'dg1',
      rang: 1,
    })

    const [{ id: disciplineId }, { id: degreeId }] = await Promise.all([
      createDiscipline,
      createDegree,
    ])

    const { id: programId } = await Program.create({
      title: 'program-1',
      handle: 'pr1',
      degreeId,
      disciplineId,
    })

    const { id } = await Curriculum.create({
      programId: programId,
      revision: 'A',
    })

    const list = await Curriculum.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, {
      id,
      revision: 'A',
      startedAt: null,
      programId: programId,
      modules: [],
    })
  }))

test('curriculum list filters', () =>
  withTestTransaction(async () => {
    const createDiscipline = Discipline.create({
      title: 'discipline-1',
      handle: 'dc1',
    })

    const createDegree = Degree.create({
      title: 'degree-1',
      handle: 'dg1',
      rang: 1,
    })

    const [{ id: disciplineId }, { id: degreeId }] = await Promise.all([
      createDiscipline,
      createDegree,
    ])

    const { id: programId } = await Program.create({
      title: 'program-1',
      handle: 'pr1',
      degreeId,
      disciplineId,
    })

    const startedAt = dayjs().toISOString()

    const { id } = await Curriculum.create({
      programId: programId,
      revision: 'A',
      startedAt,
    })

    await Curriculum.create({
      programId: programId,
      revision: 'B',
    })

    const list = await Curriculum.list({ filter: { onlyCurrentActive: true } })

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, {
      id,
      revision: 'A',
      startedAt,
      programId: programId,
      modules: [],
    })
  }))
