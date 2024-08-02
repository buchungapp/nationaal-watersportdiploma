import { User, useSupabaseClient } from '@nawadi/core'
import { LOCATION_ID } from './location.js'

export async function deleteUsers() {
  const supabase = useSupabaseClient()
  const users = await supabase.auth.admin.listUsers()
  const userIds = users.data.users.map((user) => user.id)

  await Promise.all(
    userIds.map((userId) => supabase.auth.admin.deleteUser(userId)),
  )
}

export async function addUsers() {
  // Admin
  const adminUser = await User.getOrCreateFromEmail({
    email: 'info@zeilschool-de-optimist.nl',
    displayName: 'Jan',
  })

  const adminPerson = await User.Person.getOrCreate({
    userId: adminUser.id,
    firstName: 'Jan',
    lastName: 'Jansen',
    lastNamePrefix: null,
    dateOfBirth: new Date('01-01-1980').toISOString(),
    birthCity: 'Amsterdam',
    birthCountry: 'nl',
  })

  await User.Person.createLocationLink({
    personId: adminPerson.id,
    locationId: LOCATION_ID,
  })

  await User.Actor.upsert({
    locationId: LOCATION_ID,
    type: 'instructor',
    personId: adminPerson.id,
  })

  await User.Actor.upsert({
    locationId: LOCATION_ID,
    type: 'location_admin',
    personId: adminPerson.id,
  })

  // Instructor
  const instructorUser = await User.getOrCreateFromEmail({
    email: 'emma@zeilschool-de-optimist.nl',
    displayName: 'Emma',
  })

  const instructorPerson = await User.Person.getOrCreate({
    userId: instructorUser.id,
    firstName: 'Emma',
    lastName: 'Vries',
    lastNamePrefix: 'de',
    dateOfBirth: new Date('01-01-2000').toISOString(),
    birthCity: 'Utrecht',
    birthCountry: 'nl',
  })

  await User.Person.createLocationLink({
    personId: instructorPerson.id,
    locationId: LOCATION_ID,
  })

  await User.Actor.upsert({
    locationId: LOCATION_ID,
    type: 'instructor',
    personId: instructorPerson.id,
  })

  // Students
  const studentUser = await User.getOrCreateFromEmail({
    email: 'ouder@email.nl',
    displayName: 'Ouder',
  })

  // Timo (2010)
  const studentPerson1 = await User.Person.getOrCreate({
    userId: studentUser.id,
    firstName: 'Timo',
    lastName: 'Peters',
    lastNamePrefix: null,
    dateOfBirth: new Date('01-01-2010').toISOString(),
    birthCity: 'Amsterdam',
    birthCountry: 'nl',
  })

  await User.Person.createLocationLink({
    personId: studentPerson1.id,
    locationId: LOCATION_ID,
  })

  await User.Actor.upsert({
    locationId: LOCATION_ID,
    type: 'student',
    personId: studentPerson1.id,
  })

  // Lisa (2008)
  const studentPerson2 = await User.Person.getOrCreate({
    userId: studentUser.id,
    firstName: 'Lisa',
    lastName: 'Peters',
    lastNamePrefix: null,
    dateOfBirth: new Date('01-01-2008').toISOString(),
    birthCity: 'Amsterdam',
    birthCountry: 'nl',
  })

  await User.Person.createLocationLink({
    personId: studentPerson2.id,
    locationId: LOCATION_ID,
  })

  await User.Actor.upsert({
    locationId: LOCATION_ID,
    type: 'student',
    personId: studentPerson2.id,
  })

  // Lars (2011)
  const studentPerson3 = await User.Person.getOrCreate({
    userId: studentUser.id,
    firstName: 'Lars',
    lastName: 'Peters',
    lastNamePrefix: null,
    dateOfBirth: new Date('01-01-2011').toISOString(),
    birthCity: 'Amsterdam',
    birthCountry: 'nl',
  })

  await User.Person.createLocationLink({
    personId: studentPerson3.id,
    locationId: LOCATION_ID,
  })

  await User.Actor.upsert({
    locationId: LOCATION_ID,
    type: 'student',
    personId: studentPerson3.id,
  })
}
