import * as api from '@nawadi/api'
import assert from 'assert/strict'
import test from 'node:test'
import { withTestServer } from '../testing/index.js'

test('location crud', () =>
  withTestServer(async ({ baseUrl }) => {
    let id
    {
      const entity = {
        title: 'title-123',
        handle: 'handle-123',
      }
      const result = await api.createLocation(
        // TODO this could be more friendly
        {
          contentType: 'application/json',
          parameters: {},
          entity: () => entity,
        },
        // TODO this should be made implicit in a future version of the generator
        { apiToken: 'supersecret' },
        // TODO this too
        { baseUrl },
      )

      // TODO this could be more friendly
      assert(result.status === 201)

      const item = await result.entity()
      id = item.id
    }

    {
      const result = await api.getLocations(
        {
          contentType: null,
          parameters: {},
        },
        { apiToken: 'supersecret' },
        { baseUrl },
      )
      assert(result.status === 200)

      const list = await result.entity()
      assert.equal(list.length, 1)
      assert.equal(list[0].id, id)
    }
  }))
