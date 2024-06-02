import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import { Course } from '../index.js'
import * as Discipline from './discipline.js'
import { Category } from './index.js'

test('course crud', () =>
  withTestTransaction(async () => {
    const createDiscipline = Discipline.create({
      title: 'discipline-1',
      handle: 'dc1',
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
      {
        id: parentCategoryId,
        createChild: { id: childCategoryId },
      },
    ] = await Promise.all([createDiscipline, createCategory])

    const disciplineList = await Discipline.list()
    console.log('disciplineList course.test.ts', disciplineList)

    const { id } = await Course.create({
      title: 'course-1',
      handle: 'pr1',
      disciplineId,
      categories: [childCategoryId],
    })

    // const list = await Course.list()

    // const byHandle = await Course.fromHandle('pr1')

    // assert.equal(list.length, 1)
    // const [item] = list

    // const expected = {
    //   id,
    //   title: 'program-1',
    //   handle: 'pr1',

    //   discipline: {
    //     id: disciplineId,
    //     title: 'discipline-1',
    //     handle: 'dc1',
    //     deletedAt: null,
    //     weight: 1,
    //   },

    //   categories: [
    //     {
    //       id: childCategoryId,
    //       title: 'child',
    //       handle: 'ca2',
    //       description: null,
    //       deletedAt: null,
    //       weight: 2,
    //       parent: {
    //         id: parentCategoryId,
    //         title: 'parent',
    //         handle: 'ca1',
    //         description: null,
    //         deletedAt: null,
    //         weight: 1,
    //       },
    //     },
    //   ],
    // }

    // assert.deepStrictEqual(item, expected)
    // assert.deepStrictEqual(byHandle, expected)
  }))
