import assert from "node:assert";
import { describe, it } from "node:test";
import dayjs from "dayjs";
import { withTestTransaction } from "../../contexts/index.js";
import { DEFAULT_TEST_TIMESTAMP, defaultTimestamps } from "../../utils/test.js";
import * as Course from "../course/index.js";
import * as Curriculum from "../curriculum/index.js";
import { Certificate, Location, Student } from "../index.js";
import * as User from "../user/index.js";
import * as StudentCurriculum from "./curriculum.js";

async function createModulesAndCompetencies() {
  const { id: module1Id } = await Course.Module.create({
    title: "module-1",
    handle: "mo1",
    weight: 100,
  });

  const { id: module1CompetencyId } = await Course.Competency.create({
    type: "knowledge",
    title: "competency-1",
    handle: "cp1",
    weight: 100,
  });

  const { id: module2Id } = await Course.Module.create({
    title: "module-2",
    handle: "mo2",
    weight: 101,
  });

  const { id: module2CompetencyId } = await Course.Competency.create({
    type: "skill",
    title: "competency-2",
    handle: "cp2",
    weight: 101,
  });

  const { id: module3Id } = await Course.Module.create({
    title: "module-3",
    handle: "mo3",
    weight: 102,
  });

  const { id: module3CompetencyId } = await Course.Competency.create({
    type: "knowledge",
    title: "competency-3",
    handle: "cp3",
    weight: 102,
  });

  return [
    {
      id: module1Id,
      competencies: [module1CompetencyId],
    },
    {
      id: module2Id,
      competencies: [module2CompetencyId],
    },
    {
      id: module3Id,
      competencies: [module3CompetencyId],
    },
  ] as const;
}

async function createAndStartCurriculum(
  revision: string,
  startedAt: string,
  programId: string,
  gearTypeId: string,
  modules: {
    id: string;
    competencies: {
      id: string;
      requirement?: string | null | undefined;
      required: boolean;
    }[];
  }[],
) {
  const { id: curriculumId } = await Curriculum.create({
    programId: programId,
    revision: revision,
  });

  await Curriculum.start({
    curriculumId,
    startedAt,
  });

  await Curriculum.GearType.linkToCurriculum({
    curriculumId,
    gearTypeId,
  });

  const curriculumCompetencyIds: string[] = [];

  for (const module of modules) {
    await Curriculum.linkModule({
      curriculumId,
      moduleId: module.id,
    });

    for (const competency of module.competencies) {
      const { id: curriculumCompetencyId } = await Curriculum.Competency.create(
        {
          curriculumId,
          moduleId: module.id,
          competencyId: competency.id,
          isRequired: competency.required,
          requirement: competency.requirement,
        },
      );

      curriculumCompetencyIds.push(curriculumCompetencyId);
    }
  }

  return {
    curriculumId,
    curriculumCompetencyIds,
  };
}

async function createPerson() {
  // Create a location
  const { id: locationId } = await Location.create({
    handle: "lo1",
  });

  // Create a person
  const { id: personId } = await User.Person.getOrCreate({
    firstName: "John",
    lastName: "Doe",
  });

  await User.Person.createLocationLink({
    personId,
    locationId,
  });

  return {
    personId,
    locationId,
  };
}

async function createProgramAndGearType() {
  // Create a program
  const createDiscipline = Course.Discipline.create({
    title: "discipline-1",
    handle: "dc1",
  });

  const createDegree = Course.Degree.create({
    title: "degree-1",
    handle: "dg1",
    rang: 100,
  });

  const [{ id: disciplineId }, { id: degreeId }] = await Promise.all([
    createDiscipline,
    createDegree,
  ]);

  const { id: courseId } = await Course.create({
    title: "course-1",
    handle: "co1",
    disciplineId,
  });

  const { id: programId } = await Course.Program.create({
    title: "program-1",
    handle: "pr1",
    degreeId,
    courseId,
  });

  // Create a gear type
  const { id: gearTypeId } = await Curriculum.GearType.create({
    title: "gear-type-1",
    handle: "gt1",
  });

  return {
    programId,
    courseId,
    disciplineId,
    degreeId,
    gearTypeId,
  };
}

async function createBase() {
  const { programId, gearTypeId, degreeId, courseId, disciplineId } =
    await createProgramAndGearType();
  const modules = await createModulesAndCompetencies();

  const { curriculumId, curriculumCompetencyIds } =
    await createAndStartCurriculum(
      "A",
      dayjs().subtract(2, "hour").toISOString(),
      programId,
      gearTypeId,
      modules.map((module, index) => ({
        id: module.id,
        competencies: module.competencies.map((competency) => ({
          id: competency,
          required: true,
          requirement: `This is the ${index + 1} requirement`,
        })),
      })),
    );

  return {
    programId,
    gearTypeId,
    degreeId,
    courseId,
    disciplineId,
    curriculumId,
    modules,
    curriculumCompetencyIds,
  };
}

async function createCurriculumRevision(
  curriculumId: string,
  modules: Awaited<ReturnType<typeof createModulesAndCompetencies>>,
) {
  const { id: curriculumId2 } = await Curriculum.copy({
    curriculumId,
    revision: "B",
  });

  await Curriculum.start({
    curriculumId: curriculumId2,
    startedAt: dayjs().subtract(1, "hour").toISOString(),
  });

  const curriculumCompetencies = await Curriculum.Competency.list({
    filter: {
      curriculumId: curriculumId2,
    },
  });

  return {
    curriculumId: curriculumId2,
    curriculumCompetencyIds: curriculumCompetencies
      .sort(
        (a, b) =>
          modules.findIndex((module) => module.id === a.moduleId) -
          modules.findIndex((module) => module.id === b.moduleId),
      )
      .map((competency) => competency.id),
  };
}

describe("student curriculum list program progresses", () => {
  it("should list a single program progress with no competency completed", () =>
    withTestTransaction(async () => {
      const { personId } = await createPerson();
      const { programId, gearTypeId, degreeId, curriculumId, modules } =
        await createBase();

      await StudentCurriculum.start({
        personId,
        curriculumId,
        gearTypeId,
      });

      const list = await StudentCurriculum.listProgramProgresses({
        personId,
      });

      const [item] = list;
      assert.ok(item);

      assert.deepStrictEqual(defaultTimestamps(item, ["startedAt"]), {
        startedAt: DEFAULT_TEST_TIMESTAMP,
        gearType: {
          id: gearTypeId,
          handle: "gt1",
          title: "gear-type-1",
        },
        program: {
          id: programId,
          handle: "pr1",
          title: "program-1",
        },
        degree: {
          id: degreeId,
          handle: "dg1",
          title: "degree-1",
        },
        modules: [
          {
            curriculum: {
              id: curriculumId,
              revision: "A",
              startedAt: DEFAULT_TEST_TIMESTAMP,
            },
            module: {
              id: modules[0]?.id,
              handle: "mo1",
              title: "module-1",
              weight: 100,
            },
            competencies: [
              {
                id: modules[0].competencies[0],
                type: "knowledge",
                title: "competency-1",
                handle: "cp1",
                weight: 100,
                requirement: "This is the 1 requirement",
                completed: null,
              },
            ],
          },
          {
            curriculum: {
              id: curriculumId,
              revision: "A",
              startedAt: DEFAULT_TEST_TIMESTAMP,
            },
            module: {
              id: modules[1].id,
              handle: "mo2",
              title: "module-2",
              weight: 101,
            },
            competencies: [
              {
                id: modules[1].competencies[0],
                type: "skill",
                title: "competency-2",
                handle: "cp2",
                weight: 101,
                requirement: "This is the 2 requirement",
                completed: null,
              },
            ],
          },
          {
            curriculum: {
              id: curriculumId,
              revision: "A",
              startedAt: DEFAULT_TEST_TIMESTAMP,
            },
            module: {
              id: modules[2].id,
              handle: "mo3",
              title: "module-3",
              weight: 102,
            },
            competencies: [
              {
                id: modules[2].competencies[0],
                type: "knowledge",
                title: "competency-3",
                handle: "cp3",
                weight: 102,
                requirement: "This is the 3 requirement",
                completed: null,
              },
            ],
          },
        ],
      } satisfies typeof item);
    }));

  it("should list a single program progress with one competency and module completed", () =>
    withTestTransaction(async () => {
      const { personId, locationId } = await createPerson();
      const {
        programId,
        gearTypeId,
        degreeId,
        curriculumId,
        modules,
        curriculumCompetencyIds,
      } = await createBase();

      const { id: studentCurriculumId } = await StudentCurriculum.start({
        personId,
        curriculumId,
        gearTypeId,
      });

      const { id: certificateId } = await Student.Certificate.startCertificate({
        studentCurriculumId,
        locationId,
      });

      await Student.Certificate.completeCompetency({
        studentCurriculumId,
        competencyId: curriculumCompetencyIds[0] as string,
        certificateId,
      });

      await Student.Certificate.completeCertificate({
        certificateId,
      });

      const certificate = await Certificate.byId(certificateId);

      const list = await StudentCurriculum.listProgramProgresses({
        personId,
      });

      const [item] = list;
      assert.ok(item);

      assert.deepStrictEqual(
        defaultTimestamps(item, ["startedAt", "issuedAt"]),
        {
          startedAt: DEFAULT_TEST_TIMESTAMP,
          gearType: {
            id: gearTypeId,
            handle: "gt1",
            title: "gear-type-1",
          },
          program: {
            id: programId,
            handle: "pr1",
            title: "program-1",
          },
          degree: {
            id: degreeId,
            handle: "dg1",
            title: "degree-1",
          },
          modules: [
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[0].id,
                handle: "mo1",
                title: "module-1",
                weight: 100,
              },
              competencies: [
                {
                  id: modules[0].competencies[0],
                  type: "knowledge",
                  title: "competency-1",
                  handle: "cp1",
                  weight: 100,
                  requirement: "This is the 1 requirement",
                  completed: {
                    createdAt: DEFAULT_TEST_TIMESTAMP,
                    certificate: {
                      id: certificate.id,
                      handle: certificate.handle,
                      issuedAt: DEFAULT_TEST_TIMESTAMP,
                    },
                  },
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[1].id,
                handle: "mo2",
                title: "module-2",
                weight: 101,
              },
              competencies: [
                {
                  id: modules[1].competencies[0],
                  type: "skill",
                  title: "competency-2",
                  handle: "cp2",
                  weight: 101,
                  requirement: "This is the 2 requirement",
                  completed: null,
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[2].id,
                handle: "mo3",
                title: "module-3",
                weight: 102,
              },
              competencies: [
                {
                  id: modules[2].competencies[0],
                  type: "knowledge",
                  title: "competency-3",
                  handle: "cp3",
                  weight: 102,
                  requirement: "This is the 3 requirement",
                  completed: null,
                },
              ],
            },
          ],
        } satisfies typeof item,
      );
    }));

  it("should list a single program progress with two competencies and modules completed, with separate certificates", () =>
    withTestTransaction(async () => {
      const { personId, locationId } = await createPerson();
      const {
        programId,
        gearTypeId,
        degreeId,
        curriculumId,
        modules,
        curriculumCompetencyIds,
      } = await createBase();

      const { id: studentCurriculumId } = await StudentCurriculum.start({
        personId,
        curriculumId,
        gearTypeId,
      });

      const { id: certificateId1 } = await Student.Certificate.startCertificate(
        {
          studentCurriculumId,
          locationId,
        },
      );

      await Student.Certificate.completeCompetency({
        studentCurriculumId,
        competencyId: curriculumCompetencyIds[0] as string,
        certificateId: certificateId1,
      });

      await Student.Certificate.completeCertificate({
        certificateId: certificateId1,
      });

      const certificate1 = await Certificate.byId(certificateId1);

      const { id: certificateId2 } = await Student.Certificate.startCertificate(
        {
          studentCurriculumId,
          locationId,
        },
      );

      await Student.Certificate.completeCompetency({
        studentCurriculumId,
        competencyId: curriculumCompetencyIds[1] as string,
        certificateId: certificateId2,
      });

      await Student.Certificate.completeCertificate({
        certificateId: certificateId2,
      });

      const certificate2 = await Certificate.byId(certificateId2);

      const list = await StudentCurriculum.listProgramProgresses({
        personId,
      });

      const [item] = list;
      assert.ok(item);

      assert.deepStrictEqual(
        defaultTimestamps(item, ["startedAt", "issuedAt"]),
        {
          startedAt: DEFAULT_TEST_TIMESTAMP,
          gearType: {
            id: gearTypeId,
            handle: "gt1",
            title: "gear-type-1",
          },
          program: {
            id: programId,
            handle: "pr1",
            title: "program-1",
          },
          degree: {
            id: degreeId,
            handle: "dg1",
            title: "degree-1",
          },
          modules: [
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[0].id,
                handle: "mo1",
                title: "module-1",
                weight: 100,
              },
              competencies: [
                {
                  id: modules[0].competencies[0],
                  type: "knowledge",
                  title: "competency-1",
                  handle: "cp1",
                  weight: 100,
                  requirement: "This is the 1 requirement",
                  completed: {
                    createdAt: DEFAULT_TEST_TIMESTAMP,
                    certificate: {
                      id: certificate1.id,
                      handle: certificate1.handle,
                      issuedAt: DEFAULT_TEST_TIMESTAMP,
                    },
                  },
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[1].id,
                handle: "mo2",
                title: "module-2",
                weight: 101,
              },
              competencies: [
                {
                  id: modules[1].competencies[0],
                  type: "skill",
                  title: "competency-2",
                  handle: "cp2",
                  weight: 101,
                  requirement: "This is the 2 requirement",
                  completed: {
                    createdAt: DEFAULT_TEST_TIMESTAMP,
                    certificate: {
                      id: certificate2.id,
                      handle: certificate2.handle,
                      issuedAt: DEFAULT_TEST_TIMESTAMP,
                    },
                  },
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[2].id,
                handle: "mo3",
                title: "module-3",
                weight: 102,
              },
              competencies: [
                {
                  id: modules[2].competencies[0],
                  type: "knowledge",
                  title: "competency-3",
                  handle: "cp3",
                  weight: 102,
                  requirement: "This is the 3 requirement",
                  completed: null,
                },
              ],
            },
          ],
        } satisfies typeof item,
      );
    }));

  it("should list a single program progress with two competencies and modules completed, with separate: certificates and curricula", () =>
    withTestTransaction(async () => {
      const { personId, locationId } = await createPerson();
      const {
        programId,
        gearTypeId,
        degreeId,
        curriculumId,
        modules,
        curriculumCompetencyIds,
      } = await createBase();

      const { id: studentCurriculumId } = await StudentCurriculum.start({
        personId,
        curriculumId,
        gearTypeId,
      });

      const { id: certificateId1 } = await Student.Certificate.startCertificate(
        {
          studentCurriculumId,
          locationId,
        },
      );

      await Student.Certificate.completeCompetency({
        studentCurriculumId,
        competencyId: curriculumCompetencyIds[0] as string,
        certificateId: certificateId1,
      });

      await Student.Certificate.completeCertificate({
        certificateId: certificateId1,
      });

      const certificate1 = await Certificate.byId(certificateId1);

      const {
        curriculumId: curriculumId2,
        curriculumCompetencyIds: curriculumCompetencyIds2,
      } = await createCurriculumRevision(curriculumId, modules);

      const { id: studentCurriculumId2 } = await StudentCurriculum.start({
        personId,
        curriculumId: curriculumId2,
        gearTypeId,
      });

      const { id: certificateId2 } = await Student.Certificate.startCertificate(
        {
          studentCurriculumId: studentCurriculumId2,
          locationId,
        },
      );

      await Student.Certificate.completeCompetency({
        studentCurriculumId: studentCurriculumId2,
        competencyId: curriculumCompetencyIds2[1] as string,
        certificateId: certificateId2,
      });

      await Student.Certificate.completeCertificate({
        certificateId: certificateId2,
      });

      const certificate2 = await Certificate.byId(certificateId2);

      const list = await StudentCurriculum.listProgramProgresses({
        personId,
      });

      const [item] = list;
      assert.ok(item);

      assert.deepStrictEqual(
        defaultTimestamps(item, ["startedAt", "issuedAt"]),
        {
          startedAt: DEFAULT_TEST_TIMESTAMP,
          gearType: {
            id: gearTypeId,
            handle: "gt1",
            title: "gear-type-1",
          },
          program: {
            id: programId,
            handle: "pr1",
            title: "program-1",
          },
          degree: {
            id: degreeId,
            handle: "dg1",
            title: "degree-1",
          },
          modules: [
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[0].id,
                handle: "mo1",
                title: "module-1",
                weight: 100,
              },
              competencies: [
                {
                  id: modules[0].competencies[0],
                  type: "knowledge",
                  title: "competency-1",
                  handle: "cp1",
                  weight: 100,
                  requirement: "This is the 1 requirement",
                  completed: {
                    createdAt: DEFAULT_TEST_TIMESTAMP,
                    certificate: {
                      id: certificate1.id,
                      handle: certificate1.handle,
                      issuedAt: DEFAULT_TEST_TIMESTAMP,
                    },
                  },
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[1].id,
                handle: "mo2",
                title: "module-2",
                weight: 101,
              },
              competencies: [
                {
                  id: modules[1].competencies[0],
                  type: "skill",
                  title: "competency-2",
                  handle: "cp2",
                  weight: 101,
                  requirement: "This is the 2 requirement",
                  completed: null,
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId,
                revision: "A",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[2].id,
                handle: "mo3",
                title: "module-3",
                weight: 102,
              },
              competencies: [
                {
                  id: modules[2].competencies[0],
                  type: "knowledge",
                  title: "competency-3",
                  handle: "cp3",
                  weight: 102,
                  requirement: "This is the 3 requirement",
                  completed: null,
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId2,
                revision: "B",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[0].id,
                handle: "mo1",
                title: "module-1",
                weight: 100,
              },
              competencies: [
                {
                  id: modules[0].competencies[0],
                  type: "knowledge",
                  title: "competency-1",
                  handle: "cp1",
                  weight: 100,
                  requirement: "This is the 1 requirement",
                  completed: null,
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId2,
                revision: "B",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[1].id,
                handle: "mo2",
                title: "module-2",
                weight: 101,
              },
              competencies: [
                {
                  id: modules[1].competencies[0],
                  type: "skill",
                  title: "competency-2",
                  handle: "cp2",
                  weight: 101,
                  requirement: "This is the 2 requirement",
                  completed: {
                    createdAt: DEFAULT_TEST_TIMESTAMP,
                    certificate: {
                      id: certificate2.id,
                      handle: certificate2.handle,
                      issuedAt: DEFAULT_TEST_TIMESTAMP,
                    },
                  },
                },
              ],
            },
            {
              curriculum: {
                id: curriculumId2,
                revision: "B",
                startedAt: DEFAULT_TEST_TIMESTAMP,
              },
              module: {
                id: modules[2].id,
                handle: "mo3",
                title: "module-3",
                weight: 102,
              },
              competencies: [
                {
                  id: modules[2].competencies[0],
                  type: "knowledge",
                  title: "competency-3",
                  handle: "cp3",
                  weight: 102,
                  requirement: "This is the 3 requirement",
                  completed: null,
                },
              ],
            },
          ],
        } satisfies typeof item,
      );
    }));
});
