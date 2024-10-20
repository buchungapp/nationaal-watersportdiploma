import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../../contexts/index.js'
import { Output } from './category.schema.js'
import { Category } from './index.js'

test('category crud', () =>
  withTestTransaction(async () => {
    const { id } = await Category.create({
      title: 'title-1',
      handle: 'handle-1',
    })

    // From handle
    const categoryFromHandle = await Category.fromHandle('handle-1')
    const output = {
      id,
      title: 'title-1',
      handle: 'handle-1',
      createdAt: categoryFromHandle!.createdAt,
      updatedAt: categoryFromHandle!.updatedAt,
      deletedAt: null,
      description: null,
      parent: null,
      weight: 1,
    } satisfies Output

    assert.deepStrictEqual(categoryFromHandle, output)

    // List
    const list = await Category.list()

    assert.equal(list.length, 1)
    const [item] = list

    assert.deepStrictEqual(item, output)

    // Parent
    const { id: parentId } = await Category.create({
      title: 'parent-1',
      handle: 'parent-1',
    })
    const parent = await Category.fromHandle('parent-1')

    // Update
    const updated = await Category.update({
      id,
      title: 'title-2',
      handle: 'handle-2',
      weight: 2,
      description: 'description-2',
      parentCategoryId: parentId,
    })

    assert.strictEqual(updated.id, id)

    const categoryFromHandleAfterUpdate = await Category.fromHandle('handle-2')
    const outputAfterUpdate = {
      id,
      title: 'title-2',
      handle: 'handle-2',
      createdAt: categoryFromHandle!.createdAt,
      updatedAt: categoryFromHandleAfterUpdate!.updatedAt,
      deletedAt: null,
      description: 'description-2',
      parent,
      weight: 2,
    } satisfies Output

    assert.deepStrictEqual(categoryFromHandleAfterUpdate, outputAfterUpdate)

    // Parent list
    const parentList = await Category.listParentCategories()

    assert.equal(parentList.length, 1)
    const [parentItem] = parentList

    assert.deepStrictEqual(parentItem, {
      id: parentId,
      title: 'parent-1',
      handle: 'parent-1',
      createdAt: parent!.createdAt,
      updatedAt: parent!.updatedAt,
      deletedAt: null,
      weight: 1,
      hasActiveChildren: true,
    })
  }))
