import assert from "node:assert";
import { describe, it } from "node:test";
import { withTestTransaction } from "../../contexts/index.js";
import { DEFAULT_TEST_TIMESTAMP, defaultTimestamps } from "../../utils/test.js";
import * as Course from "../course/index.js";
import * as Curriculum from "../curriculum/index.js";
import { Location, Student } from "../index.js";
import * as User from "../user/index.js";
import * as StudentCurriculum from "./curriculum.js";

async function createPersonAndCurriculumAndGearType() {
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

  const { id: curriculumId } = await Curriculum.create({
    programId: programId,
    revision: "A",
  });

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

  await Curriculum.linkModule({
    curriculumId,
    moduleId: module1Id,
  });

  const { id: module1CurriculumCompetencyId } =
    await Curriculum.Competency.create({
      curriculumId,
      moduleId: module1Id,
      competencyId: module1CompetencyId,
      isRequired: true,
      requirement: "This is the first requirement",
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

  await Curriculum.linkModule({
    curriculumId,
    moduleId: module2Id,
  });

  const { id: module2CurriculumCompetencyId } =
    await Curriculum.Competency.create({
      curriculumId,
      moduleId: module2Id,
      competencyId: module2CompetencyId,
      isRequired: true,
      requirement: "This is the second requirement",
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

  await Curriculum.linkModule({
    curriculumId,
    moduleId: module3Id,
  });

  const { id: module3CurriculumCompetencyId } =
    await Curriculum.Competency.create({
      curriculumId,
      moduleId: module3Id,
      competencyId: module3CompetencyId,
      isRequired: false,
      requirement: "This is the third requirement",
    });

  // Create a gear type
  const { id: gearTypeId } = await Curriculum.GearType.create({
    title: "gear-type-1",
    handle: "gt1",
  });

  await Curriculum.GearType.linkToCurriculum({
    curriculumId,
    gearTypeId,
  });

  return {
    personId,
    curriculumId,
    programId,
    courseId,
    disciplineId,
    degreeId,
    gearTypeId,
    module1Id,
    module2Id,
    module3Id,
    module1CompetencyId,
    module1CurriculumCompetencyId,
    module2CompetencyId,
    module2CurriculumCompetencyId,
    module3CompetencyId,
    module3CurriculumCompetencyId,
    locationId,
  };
}

describe("student curriculum list program progresses", () => {
  it("should list a single program progress with no competency completed", () =>
    withTestTransaction(async () => {
      const {
        personId,
        curriculumId,
        gearTypeId,
        programId,
        degreeId,
        module1Id,
        module2Id,
        module3Id,
        module1CompetencyId,
        module2CompetencyId,
        module3CompetencyId,
      } = await createPersonAndCurriculumAndGearType();

      const { id: studentCurriculumId } = await StudentCurriculum.start({
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
            },
            module: {
              id: module1Id,
              handle: "mo1",
              title: "module-1",
              weight: 100,
            },
            competencies: [
              {
                id: module1CompetencyId,
                type: "knowledge",
                title: "competency-1",
                handle: "cp1",
                weight: 100,
                completed: null,
              },
            ],
          },
          {
            curriculum: {
              id: curriculumId,
              revision: "A",
            },
            module: {
              id: module2Id,
              handle: "mo2",
              title: "module-2",
              weight: 101,
            },
            competencies: [
              {
                id: module2CompetencyId,
                type: "skill",
                title: "competency-2",
                handle: "cp2",
                weight: 101,
                completed: null,
              },
            ],
          },
          {
            curriculum: {
              id: curriculumId,
              revision: "A",
            },
            module: {
              id: module3Id,
              handle: "mo3",
              title: "module-3",
              weight: 102,
            },
            competencies: [
              {
                id: module3CompetencyId,
                type: "knowledge",
                title: "competency-3",
                handle: "cp3",
                weight: 102,
                completed: null,
              },
            ],
          },
        ],
      } satisfies typeof item);
    }));

  it("should list a single program progress with one competency and module completed", () =>
    withTestTransaction(async () => {
      const {
        personId,
        curriculumId,
        gearTypeId,
        programId,
        degreeId,
        module1Id,
        module2Id,
        module3Id,
        module1CompetencyId,
        module1CurriculumCompetencyId,
        module2CompetencyId,
        module2CurriculumCompetencyId,
        module3CompetencyId,
        module3CurriculumCompetencyId,
        locationId,
      } = await createPersonAndCurriculumAndGearType();

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
        competencyId: module1CurriculumCompetencyId,
        certificateId,
      });

      await Student.Certificate.completeCertificate({
        certificateId,
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
            },
            module: {
              id: module1Id,
              handle: "mo1",
              title: "module-1",
              weight: 100,
            },
            competencies: [
              {
                id: module1CompetencyId,
                type: "knowledge",
                title: "competency-1",
                handle: "cp1",
                weight: 100,
                completed: {
                  createdAt: DEFAULT_TEST_TIMESTAMP,
                },
              },
            ],
          },
          {
            curriculum: {
              id: curriculumId,
              revision: "A",
            },
            module: {
              id: module2Id,
              handle: "mo2",
              title: "module-2",
              weight: 101,
            },
            competencies: [
              {
                id: module2CompetencyId,
                type: "skill",
                title: "competency-2",
                handle: "cp2",
                weight: 101,
                completed: null,
              },
            ],
          },
          {
            curriculum: {
              id: curriculumId,
              revision: "A",
            },
            module: {
              id: module3Id,
              handle: "mo3",
              title: "module-3",
              weight: 102,
            },
            competencies: [
              {
                id: module3CompetencyId,
                type: "knowledge",
                title: "competency-3",
                handle: "cp3",
                weight: 102,
                completed: null,
              },
            ],
          },
        ],
      });
    }));
});
