import { Curriculum, Program, withDatabase } from '@nawadi/core'
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToFile,
} from '@react-pdf/renderer'
import 'dotenv/config'
import path from 'path'
import React from 'react'
import slugify from 'slugify'

async function main() {
  const [allPrograms, allActiveCurricula] = await Promise.all([
    Program.list(),
    Curriculum.list({ filter: { onlyCurrentActive: true } }),
  ])

  const perCompetency = Object.values(
    allPrograms
      .filter((program) => program.discipline.handle !== 'jachtzeilen')
      .reduce(
        (acc, program) => {
          const curriculum = allActiveCurricula.find(
            (curriculum) => curriculum.programId === program.id,
          )

          curriculum?.modules.forEach((module) => {
            module.competencies.forEach((competency) => {
              if (!acc[competency.handle]) {
                acc[competency.handle] = {
                  ...competency,
                  programs: [],
                }
              }

              const { id, handle, title, discipline, degree, categories } =
                program

              acc[competency.handle]!.programs.push({
                program: {
                  id,
                  handle,
                  title,
                  discipline,
                  degree,
                  categories,
                },
                requirement: competency.requirement,
              })
            })
          })

          return acc
        },
        {} as Record<
          string,
          Omit<
            (typeof allActiveCurricula)[number]['modules'][number]['competencies'][number],
            'requirement'
          > & {
            programs: {
              program: {
                id: string
                handle: string
                title: string | null
                discipline: {
                  id: string
                  handle: string
                  title: string | null
                }
                degree: {
                  id: string
                  handle: string
                  title: string | null
                  rang: number
                }
                categories: {
                  id: string
                  handle: string
                  title: string | null
                  parent: {
                    id: string
                    handle: string
                    title: string | null
                  } | null
                }[]
              }
              requirement: string | null
            }[]
          }
        >,
      ),
  )

  Font.register({
    family: 'Inter',
    src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf',
  })

  Font.register({
    family: 'Inter Bold',
    src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf',
  })

  const leeftijdsgroepen = ['jeugd', 'jongeren', 'volwassenen']
  const niveaus = ['niveau-1', 'niveau-2', 'niveau-3', 'niveau-4']
  const disciplines = [
    'zwaardboot-1-mans',
    'zwaardboot-2-mans',
    'catamaran',
    'kielboot',
    'windsurfen',
  ]

  const styles = StyleSheet.create({
    image: {
      height: '40px',
      width: 'auto',
      marginRight: 15,
    },
    leeftijdsgroep: {
      position: 'relative',
      paddingVertical: '8px',
      borderTopWidth: '1px',
      borderTopColor: '#6b7280',
      borderTopStyle: 'solid',
    },
    row: {
      fontSize: 10,
      flexDirection: 'row',
      paddingVertical: '6px',
    },
    leeftijdsgroepTitle: {
      position: 'absolute',
      transform: 'rotate(-90deg)',
      fontSize: 10,
      fontFamily: 'Inter Bold',
      lineHeight: 1,
      textAlign: 'center',
      height: '200px',
      width: '70px',
      left: '43px',
    },
    col2: {
      width: 6,
      paddingHorizontal: '10px',
    },
    col3: {
      paddingHorizontal: '12px',
      borderLeftColor: '#6b7280',
      borderLeftStyle: 'solid',
    },
  })

  function findRequirement(
    competency: (typeof perCompetency)[number],
    categoryHandle: string,
    degreeHandle: string,
    disciplineHandle: string,
  ) {
    return competency.programs.find(
      (program) =>
        program.program.categories.some(
          (category) => category.handle === categoryHandle,
        ) &&
        program.program.degree.handle === degreeHandle &&
        program.program.discipline.handle === disciplineHandle,
    )?.requirement
  }

  function Competency({
    comptency,
  }: {
    comptency: (typeof perCompetency)[number]
  }) {
    const relevantDisciplines = disciplines.filter((discipline) =>
      comptency.programs.some(
        (program) => program.program.discipline.handle === discipline,
      ),
    )

    return (
      <Document>
        <Page
          size="A3"
          orientation="landscape"
          style={{
            paddingVertical: 20,
            paddingHorizontal: 30,
            fontFamily: 'Inter',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Image
              style={styles.image}
              src="https://www.nationaalwatersportdiploma.nl/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fcombined-lint-final.2c48be16.png&w=640&q=100"
            />
            <Text style={{ fontFamily: 'Inter Bold' }}>
              Competentieoverzicht {`"${comptency.title}"`}
            </Text>
          </View>

          <View
            style={{
              ...styles.row,
            }}
          >
            <Text style={styles.col2} />

            {relevantDisciplines.map((discipline) => {
              const disciplineTitle = comptency.programs.find(
                (program) => program.program.discipline.handle === discipline,
              )?.program.discipline.title

              return (
                <Text
                  key={discipline}
                  style={{
                    ...styles.col3,
                    width: Math.max(225, 1125 / relevantDisciplines.length),
                    borderRightWidth: 0,
                    fontFamily: 'Inter Bold',
                  }}
                >
                  {disciplineTitle}
                </Text>
              )
            })}
          </View>

          {leeftijdsgroepen.map((leeftijdsgroep, index) => {
            const leeftijdsgroepTitle = comptency.programs
              .find((program) =>
                program.program.categories.some(
                  (category) => category.handle === leeftijdsgroep,
                ),
              )
              ?.program.categories.find(
                (category) => category.handle === leeftijdsgroep,
              )?.title

            return (
              <View
                key={leeftijdsgroep}
                style={{
                  ...styles.leeftijdsgroep,
                }}
              >
                <Text style={styles.leeftijdsgroepTitle}>
                  {leeftijdsgroepTitle}
                </Text>
                {niveaus.map((niveau, index) => {
                  return (
                    <View
                      key={niveau}
                      style={{
                        ...styles.row,
                        backgroundColor: index % 2 !== 0 ? '#f3f4f6' : 'white',
                      }}
                      wrap={false}
                    >
                      <Text style={styles.col2}>{index + 1}</Text>

                      {relevantDisciplines.map((discipline, index) => {
                        return (
                          <Text
                            key={discipline}
                            style={{
                              ...styles.col3,
                              width: Math.max(
                                225,
                                1125 / relevantDisciplines.length,
                              ),
                              borderLeftWidth: index === 0 ? 0 : '1px',
                            }}
                          >
                            {findRequirement(
                              comptency,
                              leeftijdsgroep,
                              niveau,
                              discipline,
                            )}
                          </Text>
                        )
                      })}
                    </View>
                  )
                })}
              </View>
            )
          })}
        </Page>
      </Document>
    )
  }

  const createDocumentPromises = perCompetency.map((competency) => {
    const documentName = `${competency.title}`

    return renderToFile(
      <Competency comptency={competency} />,
      path.join(
        __dirname,
        '..',
        'generated',
        'competentieoverzicht',
        `${slugify(documentName, { lower: true, strict: true, locale: 'nl' })}.pdf`,
      ),
    )
  })

  await Promise.all(createDocumentPromises)
}

const pgUri = process.env.PGURI

if (!pgUri) {
  throw new Error('PGURI environment variable is required')
}

withDatabase(
  {
    pgUri,
  },
  async () => {
    try {
      await main()
      console.log('Done')
      process.exit(0)
    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  },
)
