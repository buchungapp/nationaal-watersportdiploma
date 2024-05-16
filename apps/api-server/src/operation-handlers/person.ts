import * as api from '@nawadi/api'
import * as core from '@nawadi/core'
import * as application from '../application/index.js'

export const createPersonForLocation: api.CreatePersonForLocationOperationHandler<
  application.Authentication
> = async (incomingRequest, authentication) => {
  const { locationKey } = incomingRequest.parameters
  const entity = await incomingRequest.entity()

  if ('openId' in authentication) {
    if (authentication.openId.locationIds.indexOf(locationKey) < 0) {
      return {
        status: 403,
        contentType: null,
      }
    }

    let user:
      | Awaited<ReturnType<typeof core.User.getOrCreateFromEmail>>
      | undefined

    if (entity.email != null) {
      user = await core.User.getOrCreateFromEmail({
        email: entity.email,
        displayName: entity.firstName,
      })
    }
    const userId = user?.id ?? undefined

    const person = await core.User.Person.getOrCreate({
      userId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      lastNamePrefix: entity.lastNamePrefix,
      dateOfBirth: entity.dateOfBirth,
      birthCity: entity.birthCity,
      birthCountry: entity.birthCountry,
    })
    const personId = person.id

    await core.User.Person.createLocationLink({
      personId: personId,
      locationId: locationKey,
    })

    await core.User.Actor.upsert({
      locationId: locationKey,
      type: 'student',
      personId: personId,
    })

    return {
      status: 201,
      contentType: 'application/json',
      entity: () => ({
        id: personId,
      }),
    }
  } else {
    return {
      status: 403,
      contentType: null,
    }
  }
}
