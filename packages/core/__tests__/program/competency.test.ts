import { expect, it } from 'bun:test'
import { Competency } from '../../src/program'

it('create competency', async () => {
  const competencyID = await Competency.create({
    type: 'knowledge',
    title: 'test competency',
    handle: 'test-competency',
  })

  expect(competencyID).not.toBeNull()
})
