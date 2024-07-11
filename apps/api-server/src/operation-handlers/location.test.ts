import * as api from '@nawadi/api'
import assert from 'assert'
import test from 'node:test'
import { withTestEnvironment } from '../testing/index.js'

test('location crud', () =>
  withTestEnvironment(
    { isolation: 'transaction' },
    async ({ server, baseUrl }) => {
      server.registerApiKeyAuthentication(async (token) => {
        switch (token) {
          case 'supersecret':
            return {
              apiKey: '00000000-0000-0000-0000-000000000000',
              user: '00000000-0000-0000-0000-000000000000',
            }

          default:
            return
        }
      })

      api.facade.defaultCredentials.apiKey = 'supersecret'
      api.facade.defaultClientConfiguration.baseUrl = baseUrl

      let id
      {
        const item = await api.facade.createLocation({
          title: 'title-123',
          handle: 'handle-123',
        })
        id = item.id
      }

      {
        const list = await api.facade.getLocations()
        assert.equal(list.length, 1)
        assert.equal(list[0]?.id, id)
      }
    },
  ))
