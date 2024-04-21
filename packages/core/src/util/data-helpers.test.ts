import assert from 'assert'
import test from 'node:test'
import { aggregateOneToMany } from './data-helpers'

test.describe('aggregateOneToMany', () => {
  test.it('should aggregate one-to-many relationship correctly', () => {
    const rows = [
      { user: { id: 1, name: 'John' }, hobby: 'Reading' },
      { user: { id: 1, name: 'John' }, hobby: 'Gardening' },
    ]

    const result = aggregateOneToMany(rows, 'user', 'hobby')

    assert.deepStrictEqual(result, [
      { id: 1, name: 'John', hobby: ['Reading', 'Gardening'] },
    ])
  })
})
