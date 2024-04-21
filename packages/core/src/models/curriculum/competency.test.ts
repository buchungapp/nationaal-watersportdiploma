import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import { Program } from '../index.js'
import * as Competency from './competency.js'
import { Curriculum } from './curriculum.js'

test('competency crud', () =>
  withTestTransaction(async () => {
    const createCompetency = Program.Competency.create({
      title: 'title-1',
      handle: 'handle-1',
      type: 'knowledge',
    })

    const createModule = Program.Module.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    const createCurriculum = async () => {
      const createDiscipline = Program.Discipline.create({
        title: 'discipline-1',
        handle: 'dc1',
      })

      const createDegree = Program.Degree.create({
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

      return await Curriculum.create({
        programId: programId,
        revision: 'A',
      })
    }

    const [{ id: competencyId }, { id: moduleId }, { id: curriculumId }] =
      await Promise.all([createCompetency, createModule, createCurriculum()])

    await Curriculum.linkModule({
      curriculumId,
      moduleId,
    })

    const { id } = await Competency.create({
      competencyId,
      curriculumId,
      moduleId,
      isRequired: false,
      requirement: 'You should be awesome!',
    })

    const list = await Competency.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, {
      id,
      curriculumId,
      competencyId,
      moduleId,
      isRequired: false,
      requirement: 'You should be awesome!',
    })
  }))
