import { withDatabase } from '@nawadi/db'
import assert from 'assert'
import test from 'node:test'
import { Competency } from './competency.js'

test.skip('create competency', () =>
  withDatabase(async () => {
    const competencyId = await Competency.create({
      type: 'knowledge',
      title: 'test competency',
      handle: 'test-competency',
    })
    const competencyItem = await Competency.fromId(competencyId)
    assert.equal(competencyItem?.id, competencyId)
  }))
