import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import * as Course from './course.js'
import * as Degree from './degree.js'
import * as Discipline from './discipline.js'
import { Category } from './index.js'
import * as Program from './program.js'

test('program crud', () =>
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

    const createCategory = Category.create({
      title: 'parent',
      handle: 'ca1',
    }).then(async ({ id }) => {
      return {
        id,
        createChild: await Category.create({
          title: 'child',
          handle: 'ca2',
          parentCategoryId: id,
        }),
      }
    })

    const [
      { id: disciplineId },
      { id: degreeId },
      {
        id: parentCategoryId,
        createChild: { id: childCategoryId },
      },
    ] = await Promise.all([createDiscipline, createDegree, createCategory])

    const { id: courseId } = await Course.create({
      title: 'course-1',
      handle: 'co1',
      disciplineId,
    })

    const { id: programId } = await Program.create({
      handle: 'pr1',
      degreeId,
      courseId,
    })

    const list = await Program.list()

    const byHandle = await Program.fromHandle('pr1')

    assert.equal(list.length, 1)
    const [item] = list

    const expected = {
      id: programId,
      title: 'program-1',
      handle: 'pr1',

      discipline: {
        id: disciplineId,
        title: 'discipline-1',
        handle: 'dc1',
        deletedAt: null,
        weight: 1,
      },

      degree: {
        id: degreeId,
        title: 'degree-1',
        handle: 'dg1',
        rang: 1,
        deletedAt: null,
      },

      categories: [
        {
          id: childCategoryId,
          title: 'child',
          handle: 'ca2',
          description: null,
          deletedAt: null,
          weight: 2,
          parent: {
            id: parentCategoryId,
            title: 'parent',
            handle: 'ca1',
            description: null,
            deletedAt: null,
            weight: 1,
          },
        },
      ],
    }

    assert.deepStrictEqual(item, expected)
    assert.deepStrictEqual(byHandle, expected)
  }))
