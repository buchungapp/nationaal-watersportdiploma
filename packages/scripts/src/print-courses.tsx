import 'dotenv/config'

import { Course, Curriculum, withDatabase } from '@nawadi/core'
import {
  Document,
  Font,
  Image,
  Page,
  PageProps,
  StyleSheet,
  Text,
  View,
  renderToFile,
} from '@react-pdf/renderer'
import path from 'path'
import React, { Fragment, PropsWithChildren } from 'react'
import { projectRoot } from './utils/root.js'

async function main() {
  const [allActiveCurricula, allCourses, allPrograms] = await Promise.all([
    Curriculum.list({ filter: { onlyCurrentActive: true } }),
    Course.list(),
    Course.Program.list(),
  ])

  Font.register({
    family: 'Inter',
    src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf',
  })

  Font.register({
    family: 'Inter Bold',
    src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf',
  })

  // Create styles
  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Inter',
      fontSize: 14,
      paddingTop: 60,
      paddingBottom: 65,
      paddingHorizontal: 35,
    },
    image: {
      position: 'absolute',
      left: 35,
      top: 15,
      height: '35px',
      width: 'auto',
    },
    footer: {
      position: 'absolute',
      fontSize: 10,
      bottom: 30,
      left: 0,
      right: 0,
      paddingHorizontal: 35,
      color: 'grey',
    },
  })

  function PageLayout({
    children,
    style,
    footerTitle,
    ...pageProps
  }: PropsWithChildren<
    {
      style?: any
      footerTitle?: string | undefined
    } & PageProps
  >) {
    return (
      <Page
        size="A4"
        style={{
          ...styles.page,
          ...style,
        }}
        {...pageProps}
      >
        <Image
          fixed
          style={styles.image}
          src="https://www.nationaalwatersportdiploma.nl/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fcombined-lint-final.2c48be16.png&w=640&q=100"
        />
        {children}
        {footerTitle ? (
          <Text
            style={{
              ...styles.footer,
              textAlign: 'left',
            }}
            fixed
          >
            {footerTitle}
          </Text>
        ) : null}
        <Text
          style={{
            ...styles.footer,
            textAlign: 'right',
          }}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    )
  }

  const programStyles = StyleSheet.create({
    title: {
      fontFamily: 'Inter Bold',
      fontSize: 20,
      marginBottom: 16,
    },
    moduleTitleSection: {
      fontFamily: 'Inter Bold',
      backgroundColor: '#EEE',
      borderBottomWidth: 1,
      borderBottomColor: '#6b7280',
      borderBottomStyle: 'solid',
      fontSize: 12,
      paddingVertical: 2,
    },
    moduleTitle: {
      textAlign: 'center',
    },
    moduleSection: {
      marginVertical: 4,
      borderColor: '#374151',
      borderWidth: 1,
      borderStyle: 'solid',
    },
    competencySection: {
      marginVertical: 4,
    },
    comptencyTitle: {
      fontFamily: 'Inter Bold',
    },
    comptencyContent: {
      marginTop: 2,
    },
    moduleCardRow: {
      flexDirection: 'row',
      marginVertical: 4,
      paddingHorizontal: 6,
    },
    moduleCardRowLabel: {
      fontSize: 10,
      fontFamily: 'Inter Bold',
      width: '20%',
    },
    moduleCardRowContent: { width: '80%', fontSize: 10 },
  })

  function ModuleCardRow({
    label,
    children,
  }: PropsWithChildren<{ label: string }>) {
    return (
      <View style={programStyles.moduleCardRow}>
        <Text style={programStyles.moduleCardRowLabel}>{label}</Text>
        <View style={programStyles.moduleCardRowContent}>{children}</View>
      </View>
    )
  }

  function ProgramPage({ program }: { program: (typeof allPrograms)[0] }) {
    const curriculum = allActiveCurricula.find(
      (c) => c.programId === program.id,
    )

    return (
      <PageLayout bookmark="Modules" footerTitle={program.title ?? undefined}>
        <View>
          <Text style={programStyles.title}>{program.title}</Text>
        </View>

        <View>
          {curriculum?.modules.map((module) => (
            <View
              key={module.id}
              style={programStyles.moduleSection}
              {...{ bookmark: module.title }}
            >
              <View style={programStyles.moduleTitleSection}>
                <Text
                  style={programStyles.moduleTitle}
                >{`${module.weight}. ${module.title}`}</Text>
              </View>

              <View>
                <ModuleCardRow label="Competenties">
                  <Fragment>
                    {module.competencies.map((competency) => (
                      <View
                        key={competency.handle}
                        style={programStyles.competencySection}
                        wrap={false}
                      >
                        <Text style={programStyles.comptencyTitle}>
                          {`${competency.weight}. ${competency.title}`}
                        </Text>
                        <Text style={programStyles.comptencyContent}>
                          {competency.requirement}
                        </Text>
                      </View>
                    ))}
                  </Fragment>
                </ModuleCardRow>
              </View>
            </View>
          ))}
        </View>
      </PageLayout>
    )
  }

  const coverPageStyles = StyleSheet.create({
    title: {
      fontFamily: 'Inter Bold',
      textAlign: 'center',
      fontSize: 24,
    },
    summary: {
      marginVertical: 20,
    },
    summaryRow: {
      flexDirection: 'row',
    },
  })

  function SummaryRow({
    label,
    description,
  }: {
    label: string
    description: React.ReactNode
  }) {
    return (
      <View style={coverPageStyles.summaryRow}>
        <Text style={{ width: '30%' }}>{`${label}: `}</Text>

        <Text style={{ width: '70%' }}>{description}</Text>
      </View>
    )
  }

  function formatDate(date: string) {
    let d = new Date(date),
      day = '' + d.getDate(),
      month = '' + (d.getMonth() + 1),
      year = d.getFullYear()

    if (day.length < 2) day = '0' + day
    if (month.length < 2) month = '0' + month

    return [day, month, year].join('-')
  }

  const programSummaryStyles = StyleSheet.create({
    container: {
      marginVertical: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      fontSize: 12,
    },
    title: {
      width: '52%',
    },
    degree: {
      width: '16%',
    },
    revision: {
      width: '16%',
    },
    startedAt: {
      width: '16%',
    },
  })

  function ProgramsSummary({ programs }: { programs: typeof allPrograms }) {
    return (
      <View style={programSummaryStyles.container}>
        <Text style={{ marginBottom: 5, textDecoration: 'underline' }}>
          Programmaoverzicht
        </Text>
        <View style={programSummaryStyles.row}>
          <Text
            style={{
              ...programSummaryStyles.title,
              fontFamily: 'Inter Bold',
              paddingBottom: 2,
            }}
          >
            Titel
          </Text>
          <Text
            style={{
              ...programSummaryStyles.degree,
              fontFamily: 'Inter Bold',
              paddingBottom: 2,
            }}
          >
            Niveau
          </Text>
          <Text
            style={{
              ...programSummaryStyles.revision,
              fontFamily: 'Inter Bold',
              paddingBottom: 2,
            }}
          >
            Revisie
          </Text>
          <Text
            style={{
              ...programSummaryStyles.startedAt,
              fontFamily: 'Inter Bold',
              paddingBottom: 2,
            }}
          >
            Geldig vanaf
          </Text>
        </View>
        {programs
          .sort((a, b) => a.degree.rang - b.degree.rang)
          .map((program, index) => {
            const curriculum = allActiveCurricula.find(
              (c) => c.programId === program.id,
            )

            return (
              <View
                key={program.id}
                style={{
                  ...programSummaryStyles.row,
                  backgroundColor: index % 2 !== 0 ? '#f3f4f6' : 'white',
                }}
              >
                <Text style={programSummaryStyles.title}>
                  {`${program.title ?? program.course.title} ${program.degree.title}`}
                </Text>
                <Text style={programSummaryStyles.degree}>
                  {program.degree.title}
                </Text>
                <Text style={programSummaryStyles.revision}>
                  {curriculum?.revision}
                </Text>
                <Text style={programSummaryStyles.startedAt}>
                  {curriculum?.startedAt
                    ? formatDate(curriculum.startedAt)
                    : '-'}
                </Text>
              </View>
            )
          })}
      </View>
    )
  }

  const programMatrixStyles = StyleSheet.create({
    container: {
      marginVertical: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      fontSize: 12,
    },
    index: {
      width: '5%',
      fontVariantNumeric: 'tabular-nums',
    },
    title: {
      width: '45%',
    },
    type: {
      width: '18%',
    },
    status: {
      width: '8%',
      textAlign: 'center',
    },
  })

  function ProgramMatrix({ programs }: { programs: typeof allPrograms }) {
    // Create a unique set of modules with the complete module object
    const uniqueModules = allActiveCurricula
      .filter((curriculum) =>
        programs.some((program) => program.id === curriculum.programId),
      )
      .flatMap((program) => program.modules)
      .filter(
        (module, index, self) =>
          self.findIndex((m) => m.id === module.id) === index,
      )
      .sort((a, b) => (a.title ?? a.handle).localeCompare(b.title ?? b.handle))

    // Create a matrix where each row is a module and each column is a program
    // Inside each cell, we will show weather the module is available and if so if it is required for the program

    return (
      <View style={programMatrixStyles.container}>
        <Text style={{ marginBottom: 5, textDecoration: 'underline' }}>
          Module-overzicht
        </Text>
        <View style={programMatrixStyles.row}>
          <Text style={programMatrixStyles.index} />

          <Text
            style={{
              ...programMatrixStyles.title,
              paddingBottom: 2,
              fontFamily: 'Inter Bold',
            }}
          >
            Module
          </Text>
          <Text
            style={{
              ...programMatrixStyles.type,
              paddingBottom: 2,
              fontFamily: 'Inter Bold',
            }}
          >
            Type
          </Text>
          {programs.map((program) => (
            <View
              key={program.id}
              style={{
                ...programMatrixStyles.status,
                height: '75px',
                position: 'relative',
              }}
            >
              <Text
                style={{
                  bottom: '50%',
                  left: '-46%',
                  width: '80px',
                  position: 'absolute',
                  textAlign: 'left',
                  fontFamily: 'Inter Bold',
                  transform: 'rotate(-90deg)',
                }}
              >
                {program.degree.title}
              </Text>
            </View>
          ))}
        </View>
        {uniqueModules.map((module, index) => (
          <View
            key={module.id}
            style={{
              ...programMatrixStyles.row,
              backgroundColor: index % 2 !== 0 ? '#f3f4f6' : 'white',
            }}
          >
            <Text style={programMatrixStyles.index}>{`${module.weight}.`}</Text>
            <Text style={programMatrixStyles.title}>{module.title}</Text>
            <Text style={programMatrixStyles.type}>
              {module.type === 'skill' ? 'Praktijk' : 'Theorie'}
            </Text>
            {programs.map((program) => {
              const curriculum = allActiveCurricula.find(
                (c) => c.programId === program.id,
              )

              const programModule = curriculum?.modules.find(
                (m) => m.id === module.id,
              )

              return (
                <Text key={program.id} style={programMatrixStyles.status}>
                  {programModule ? (programModule.isRequired ? 'S' : 'O') : '-'}
                </Text>
              )
            })}
          </View>
        ))}

        <View
          style={{
            marginTop: 15,
            fontSize: 10,
            textAlign: 'right',
          }}
        >
          <Text>'S' = Standaard module</Text>
          <Text>'O' = Optionele module</Text>
        </View>
      </View>
    )
  }
  function CoverPage({ course }: { course: (typeof allCourses)[number] }) {
    const programsForCourse = allPrograms.filter(
      (program) => program.course.id === course.id,
    )

    return (
      <PageLayout bookmark="Voorblad">
        <View>
          <Text style={coverPageStyles.title}>Cursusoverzicht</Text>
        </View>

        <View style={coverPageStyles.summary}>
          <SummaryRow label={'Titel'} description={course.title} />
          <SummaryRow
            label={'Discipline'}
            description={course.discipline.title}
          />
          {course.categories.map((category) => {
            return (
              <SummaryRow
                key={category.id}
                label={category.parent?.title ?? ''}
                description={category.title}
              />
            )
          })}
        </View>

        <ProgramsSummary programs={programsForCourse} />

        <ProgramMatrix programs={programsForCourse} />

        <Text style={{ marginTop: 40, fontSize: 8, color: 'grey' }}>
          ©️ 2024 Nationaal Watersportdiploma. Alle rechten voorbehouden. Geen
          enkel deel van deze diplomalijn mag worden gereproduceerd,
          gedistribueerd, of overgedragen in enige vorm of op enige wijze,
          inclusief fotokopiëren, opnemen, of andere elektronische of
          mechanische methoden, zonder de voorafgaande schriftelijke toestemming
          van de vereniging Nationaal Watersportdiploma. Voor de volledige tekst
          van de licentievoorwaarden kunt u contact opnemen met de vereniging.
        </Text>
      </PageLayout>
    )
  }

  const createDocumentPromises = allCourses.map((course) => {
    const documentName = course.title

    const programsForCourse = allPrograms.filter(
      (program) => program.course.id === course.id,
    )

    return renderToFile(
      <Document>
        {/* Cover page */}
        <CoverPage course={course} />

        {programsForCourse.map((program) => (
          <ProgramPage key={program.id} program={program} />
        ))}
      </Document>,
      path.join(
        projectRoot,
        '..',
        'generated',
        'cursusoverzicht',
        `${documentName}.pdf`,
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
