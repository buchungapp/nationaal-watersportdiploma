import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import assert from 'assert'
import test from 'node:test'
import { withTestServer } from '../testing/index.js'

test('api-key authentication', () =>
  withTestServer(async ({ baseUrl }) => {
    const userItem = await core.User.getOrCreateFromEmail({
      email: 'test@test.test',
      displayName: 'test harry',
    })

    const apiKeyItem = await core.ApiKey.createForUser({
      name: 'test api-key',
      userId: userItem.id,
    })

    const result = await api.me(
      {
        contentType: null,
        parameters: {},
      },
      { apiKey: apiKeyItem.token } as api.MeCredentials, // TODO generator should do this properly, cast should  not be necessary
      { baseUrl },
    )

    assert(result.status === 200)

    const meItem = await result.entity()
    assert.equal(meItem.id, userItem.id)
  }))
