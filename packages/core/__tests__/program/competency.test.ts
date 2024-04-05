import { expect, it } from 'bun:test'
import { Competency } from '../../src/program'

it('create competency', async () => {
  const competencyId = await Competency.create({
    type: 'knowledge',
    title: 'test competency',
    handle: 'test-competency',
  })

  expect(await Competency.fromId(competencyId).then((x) => x?.id)).toBe(
    competencyId,
  )
})
