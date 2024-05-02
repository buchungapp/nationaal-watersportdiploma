import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import assert from 'assert'
import test from 'node:test'
import { withTestEnvironment } from '../testing/index.js'

test('open-id authentication', () =>
  withTestEnvironment(async ({ baseUrl }) => {
    const supabaseClient = core.useSupabaseClient()

    const createUserResult = await supabaseClient.auth.admin.createUser({
      email: 'test@test.test',
      email_confirm: true,
      password: 'supersecret',
    })
    assert.ifError(createUserResult.error)

    const authUserItem = createUserResult.data.user
    assert(authUserItem != null)

    try {
      const signInResult = await supabaseClient.auth.signInWithPassword({
        email: 'test@test.test',
        password: 'supersecret',
      })
      assert.ifError(signInResult.error)
      const sessionItem = signInResult.data.session
      assert(sessionItem != null)

      const token = sessionItem.access_token

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
      assert.equal(meItem.id, authUserItem.id)
    } finally {
      await supabaseClient.auth.admin.deleteUser(authUserItem.id)
    }
  }))
