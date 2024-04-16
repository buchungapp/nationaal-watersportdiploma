import assert from 'assert'
import test from 'node:test'
import { withTestTransaction } from '../contexts/index.js'
import { Competency } from './competency.js'

test('create competency', () =>
  withTestTransaction(async () => {
    const competencyId = await Competency.create({
      type: 'knowledge',
      title: 'test competency',
      handle: 'test-competency',
    })
    const competencyItem = await Competency.fromId(competencyId)
    assert.equal(competencyItem?.id, competencyId)
  }))
