import { withDatabase } from '@nawadi/db'
import test from 'node:test'
import { Competency } from './competency.js'
import assert = require('assert')

test('create competency', () =>
  withDatabase(async () => {
    const competencyId = await Competency.create({
      type: 'knowledge',
      title: 'test competency',
      handle: 'test-competency',
    })
    const competencyItem = await Competency.fromId(competencyId)
    assert.equal(competencyItem?.id, competencyId)
  }))
