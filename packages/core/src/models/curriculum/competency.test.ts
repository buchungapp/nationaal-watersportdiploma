import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import { Course } from '../index.js'
import * as Competency from './competency.js'
import { Output } from './competency.schema.js'
import { Curriculum } from './curriculum.js'

test('competency crud', () =>
  withTestTransaction(async () => {
    const createCompetency = Course.Competency.create({
      title: 'title-1',
      handle: 'handle-1',
      type: 'knowledge',
    })

    const createModule = Course.Module.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    const createCurriculum = async () => {
      const createDiscipline = Course.Discipline.create({
        title: 'discipline-1',
        handle: 'dc1',
      })

      const createDegree = Course.Degree.create({
        title: 'degree-1',
        handle: 'dg1',
        rang: 1,
      })

      const [{ id: disciplineId }, { id: degreeId }] = await Promise.all([
        createDiscipline,
        createDegree,
      ])

      const { id: courseId } = await Course.create({
        title: 'course-1',
        handle: 'co1',
        disciplineId,
      })

      const { id: programId } = await Course.Program.create({
        handle: 'pr1',
        degreeId,
        courseId,
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

    assert.strictEqual(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, {
      id,
      curriculumId,
      competencyId,
      moduleId,
      isRequired: false,
      requirement: 'You should be awesome!',
      deletedAt: null,
      createdAt: item!.createdAt,
      updatedAt: item!.updatedAt,
    } satisfies Output)
  }))
