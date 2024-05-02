import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import assert from 'assert'
import test from 'node:test'
import { withTestEnvironment } from '../testing/index.js'

test('api-key authentication', () =>
  withTestEnvironment({ isolation: 'supabase' }, async ({ baseUrl }) => {
    const supabaseClient = core.useSupabaseClient()

    // const createUserResult = await supabaseClient.auth.admin.createUser({
    //   email: 'test@test.test',
    //   email_confirm: true,
    //   password: 'supersecret',
    // })
    // assert.ifError(createUserResult.error)

    // const authUserItem = createUserResult.data.user
    // assert(authUserItem != null)

    const userItem = await core.User.getOrCreateFromEmail({
      email: 'test@test.test',
      displayName: 'test harry',
    })
    // assert.equal(userItem.id, authUserItem.id)

    const apiKeyItem = await core.ApiKey.createForUser({
      name: 'test api-key',
      userId: userItem.id,
    })

    const result = await api.me(
      {
        contentType: null,
        parameters: {},
      },
      { apiKey: apiKeyItem.token },
      { baseUrl },
    )

    assert(result.status === 200)

    const meItem = await result.entity()
    assert.equal(meItem.id, userItem.id)
  }))
