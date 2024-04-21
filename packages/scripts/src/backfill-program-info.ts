/**
 * This script retrieves data from a Google Spreadsheet and processes it to create programs.
 * It uses the Google Sheets API to fetch the data and the @nawadi/core/program library to create programs.
 * The script reads the data from the spreadsheet, filters out internal sheets, and processes each row of data.
 * For each row, it creates or retrieves the necessary entities (discipline, degree, category, module, competency),
 * and then creates a program using the retrieved entities.
 * The created programs are then logged to the console.
 *
 * Note: This script requires the necessary environment variables to be set for Google authentication and the spreadsheet ID.
 */

import 'dotenv/config'

import {
  Curriculum,
  Program,
  withDatabase,
  withTransaction,
} from '@nawadi/core'
import { GoogleAuth } from 'google-auth-library'
import { google } from 'googleapis'
import slugify from 'slugify'
import { z } from 'zod'

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
})

const service = google.sheets({ version: 'v4', auth })

const spreadsheetId = process.env.DIPLOMALIJN_SPREADSHEET_ID!

// Retrieve all sheets from spreadsheet
async function retrieveSheets() {
  const result = await service.spreadsheets.get({
    spreadsheetId,
  })

  // Filter out all internal sheet that start with an underscore
  return (
    result.data.sheets?.filter((sheet) => {
      return !sheet.properties?.title?.startsWith('_')
    }) ?? []
  )
}

const rowSchema = z.tuple([
  z.string().trim(),
  z.preprocess(
    (val) => String(val).trim(),
    z.union([
      z.literal('Jeugd'),
      z.literal('Jongeren'),
      z.literal('Volwassenen'),
    ]),
  ),
  z.preprocess((val) => {
    // Extract number from string
    const match = String(val).match(/\d+/)
    return match ? Number(match[0]) : ''
  }, z.number().int().min(1).max(4)),
  z.string().trim(),
  z.preprocess(
    (val) => String(val).trim(),
    z.union([z.literal('Verplicht'), z.literal('Optioneel')]),
  ),
  z.string().trim(),
  z.string().trim(),
])

const slugifyOpts = {
  lower: true,
  strict: true,
  locale: 'nl',
} satisfies Parameters<typeof slugify>[1]

const dedupeCache = new Map<string, Promise<string>>()

async function getOrCreateCachedItem<T extends { id: string }>(
  entityType: {
    fromHandle: (handle: string) => Promise<T | null>
    create: (opts: any) => Promise<{ id: string }>
  },
  handle: string,
  title: string,
  cacheKey: string,
  extraOpts = {},
): Promise<string> {
  let promise = dedupeCache.get(cacheKey)
  if (!promise) {
    promise = entityType.fromHandle(handle).then(async (item) => {
      if (!item?.id) {
        const newItem = entityType
          .create({
            handle,
            title,
            ...extraOpts,
          })
          .then((newItem) => newItem.id)
        dedupeCache.set(cacheKey, newItem)
        return newItem
      }
      return item.id
    })
    dedupeCache.set(cacheKey, promise)
  }
  return promise
}

/**
 * Processes a row of data and creates a program based on the information in the row.
 * @param row - The row of data to process.
 * @returns A Promise that resolves to the created program.
 */
async function processRow(row: z.infer<typeof rowSchema>) {
  try {
    // Discipline
    const disciplineTitle = row[0].startsWith('Jacht/kajuitzeilen ')
      ? 'Jachtzeilen'
      : row[0]
    const disciplineHandle = slugify(disciplineTitle.trim(), slugifyOpts)
    const disciplinePromise = getOrCreateCachedItem(
      Program.Discipline,
      disciplineHandle,
      disciplineTitle.trim(),
      `discipline-${disciplineHandle}`,
    )

    // Degree
    const degreeHandle = `niveau-${row[2]}`
    const degreePromise = getOrCreateCachedItem(
      Program.Degree,
      degreeHandle,
      `Niveau ${row[2]}`,
      `degree-${degreeHandle}`,
      { rang: row[2] },
    )

    // Categories
    const categoryPromises = Promise.all(
      [
        row[1],
        row[0].startsWith('Jacht/kajuitzeilen ')
          ? row[0].split('Jacht/kajuitzeilen ')[1]?.trim()
          : undefined,
      ]
        .filter((cat): cat is string => Boolean(cat))
        .map(async (category, index) => {
          const categoryHandle = slugify(category, slugifyOpts)
          return getOrCreateCachedItem(
            Program.Category,
            categoryHandle,
            category,
            `category-${categoryHandle}`,
            {
              parentCategoryId: await (index === 0
                ? getOrCreateCachedItem(
                    Program.Category,
                    'leeftijdsgroep',
                    'Leeftijdsgroep',
                    `category-leeftijdsgroep`,
                  )
                : getOrCreateCachedItem(
                    Program.Category,
                    'vaarwater',
                    'Vaarwater',
                    `category-vaarwater`,
                  )),
            },
          )
        }),
    )

    // Module
    const moduleHandle = slugify(row[3], slugifyOpts)
    const modulePromise = getOrCreateCachedItem(
      Program.Module,
      moduleHandle,
      row[3],
      `module-${moduleHandle}`,
    )

    // Competency
    const competencyHandle = slugify(row[5], slugifyOpts)
    const competencyPromise = getOrCreateCachedItem(
      Program.Competency,
      competencyHandle,
      row[5],
      `competency-${competencyHandle}`,
      {
        type: row[3].startsWith('Theorie') ? 'knowledge' : 'skill',
      },
    )

    const [disciplineId, degreeId, moduleId, competencyId, categoryIds] =
      await Promise.all([
        disciplinePromise,
        degreePromise,
        modulePromise,
        competencyPromise,
        categoryPromises,
      ])

    const programName = `${row[0]} ${row[1]} ${row[2]}`
    const programHandle = slugify(programName, slugifyOpts)

    const programId = await getOrCreateCachedItem(
      Program,
      programHandle,
      programName,
      `program-${programHandle}`,
      {
        degreeId,
        disciplineId,
        categories: categoryIds,
      },
    )

    let curriculumPromise = dedupeCache.get(`curriculum-${programId}`)
    if (!curriculumPromise) {
      curriculumPromise = Curriculum.list({ filter: { programId } }).then(
        (curricula) => {
          const curriculum = curricula[0]

          if (!curriculum) {
            const newItem = Curriculum.create({
              programId,
              revision: '2401',
              startedAt: new Date('2024-04-01').toISOString(),
            }).then((newItem) => newItem.id)

            dedupeCache.set(`curriculum-${programId}`, newItem)
            return newItem
          }
          return curriculum.id
        },
      )
      dedupeCache.set(`curriculum-${programId}`, curriculumPromise)
    }

    const curriculumId = await curriculumPromise

    await Curriculum.linkModule({
      curriculumId,
      moduleId,
    }).catch((error) => {
      // Ignore duplicate key errors
    })

    await Curriculum.Competency.create({
      competencyId,
      curriculumId,
      moduleId,
      isRequired: !!(row[4] === 'Verplicht'),
      requirement: row[6],
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function main() {
  const sheets = await retrieveSheets()

  const rows = await service.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: sheets.map((sheet) => `${sheet.properties?.title!}!A2:G`),
  })

  const promises = []
  for (const sheet of rows.data.valueRanges ?? []) {
    for (const row of sheet.values ?? []) {
      try {
        const competence = rowSchema.parse(row)
        promises.push(processRow(competence))
      } catch (error) {
        console.error('Invalid row:', row)
        // Stop both loops
        throw error
      }
    }
  }

  return await Promise.all(promises)
}

const pgUri = process.env.PGURI

if (!pgUri) {
  throw new Error('PGURI environment variable is required')
}

withDatabase(
  {
    pgUri,
  },
  async () =>
    withTransaction(async () => {
      await main()
    }),
)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
