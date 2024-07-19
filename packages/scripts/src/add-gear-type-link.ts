import { Course, Curriculum, withDatabase } from '@nawadi/core'
import 'dotenv/config'
import inquirer from 'inquirer'

async function main() {
  const { gearType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'gearType',
      message: 'Which gear type would you like to link?',
      choices: async () => {
        const gearTypes = await Curriculum.GearType.list()

        return gearTypes.map((gearType) => ({
          name: gearType.title,
          value: gearType.id,
        }))
      },
    },
  ])

  const { discipline, ageCategories } = await inquirer.prompt([
    {
      type: 'list',
      name: 'discipline',
      message: 'In which discipline would you like to add a new link?',
      choices: async () => {
        const disciplines = await Course.Discipline.list()

        return disciplines.map((discipline) => ({
          name: discipline.title,
          value: discipline.id,
        }))
      },
    },
    {
      type: 'checkbox',
      name: 'ageCategories',
      message: 'In which age categories would you like to add a new link?',
      choices: async () => {
        const categories = await Course.Category.list()

        return categories
          .filter((c) => c.parent?.handle === 'leeftijdscategorie')
          .map((ageCategory) => ({
            name: ageCategory.title,
            value: ageCategory.id,
          }))
      },
    },
  ])

  const curricula = await Curriculum.list({
    filter: {
      categoryId: ageCategories,
      disciplineId: discipline,
      onlyCurrentActive: true,
    },
  })

  await Promise.all(
    curricula.map(async (curriculum) => {
      await Curriculum.GearType.linkToCurriculum({
        curriculumId: curriculum.id,
        gearTypeId: gearType,
      })
    }),
  )
}

const pgUri = process.env.PGURI

if (!pgUri) {
  throw new Error('PGURI environment variable is required')
}

withDatabase(
  {
    pgUri,
  },
  async () => await main(),
)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
