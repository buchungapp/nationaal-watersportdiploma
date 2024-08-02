import { processing } from '../utils/processing.js'
import { addPrivileges } from './privileges.js'
import { addRoles } from './roles.js'

const INDENTATION = 2
export async function addRolesAndDepencies() {
  // Add privileges
  await processing(
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await addPrivileges()
    },
    {
      icon: '⚖️',
      text: 'Adding privileges...',
      successText: 'Privileges added',
      failText: 'Failed to add privileges',
      indentation: INDENTATION,
    },
  )

  // Add roles
  await processing(addRoles, {
    icon: '🪪',
    text: 'Adding roles...',
    successText: 'Roles added',
    failText: 'Failed to add roles',
    indentation: INDENTATION,
  })
}
