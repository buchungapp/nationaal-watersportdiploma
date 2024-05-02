import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import assert from 'assert'
import test from 'node:test'
import { withTestEnvironment } from '../testing/index.js'

test('open-id authentication', () =>
  withTestEnvironment(async ({ baseUrl }) => {
    const userItem = await core.User.getOrCreateFromEmail({
      email: 'test@test.test',
      displayName: 'test harry',
    })

    const supabaseClient = core.useSupabaseClient()

    const token = '' // TODO get token somehow

    const result = await api.me(
      {
        contentType: null,
        parameters: {},
      },
      { openId: token } as api.MeCredentials, // TODO generator should do this properly, cast should  not be necessary
      { baseUrl },
    )

    assert(result.status === 200)

    const meItem = await result.entity()
    assert.equal(meItem.id, userItem.id)
  }))
