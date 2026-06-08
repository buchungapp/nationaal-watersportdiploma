import {
  Course,
  Curriculum,
  withDatabase,
  withTransaction,
} from "@nawadi/core";
import "dotenv/config";

const NWD_C_DEGREE_HANDLE = "niveau-c";
const VOLWASSENEN_CATEGORY_HANDLE = "volwassenen";

const TARGET_DISCIPLINE_HANDLES = [
  "zwaardboot-1-mans",
  "zwaardboot-2-mans",
  "kielboot",
  "catamaran",
  "windsurfen",
  "jachtzeilen",
] as const;

async function main() {
  const pgUri =
    process.env.PGURI ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

  await withDatabase(pgUri, async () => {
    await withTransaction(async () => {
      let degree = await Course.Degree.fromHandle(NWD_C_DEGREE_HANDLE);

      if (!degree) {
        const created = await Course.Degree.create({
          handle: NWD_C_DEGREE_HANDLE,
          title: "C",
          rang: 7,
        });
        degree = (await Course.Degree.fromHandle(NWD_C_DEGREE_HANDLE))!;
        console.log(`Created degree C (${created.id})`);
      } else {
        console.log(`Degree C already exists (${degree.id})`);
      }

      const [courses, programs] = await Promise.all([
        Course.list({}),
        Course.Program.list({}),
      ]);

      const volwassenenCourses = courses.filter(
        (course) =>
          TARGET_DISCIPLINE_HANDLES.includes(
            course.discipline.handle as (typeof TARGET_DISCIPLINE_HANDLES)[number],
          ) &&
          course.categories.some(
            (category) => category.handle === VOLWASSENEN_CATEGORY_HANDLE,
          ),
      );

      console.log(`Found ${volwassenenCourses.length} volwassenen courses`);

      for (const course of volwassenenCourses) {
        const programHandle = `${course.handle}-c`;
        const existingProgram = programs.find(
          (program) => program.handle === programHandle,
        );

        if (existingProgram) {
          console.log(`Program ${programHandle} already exists, skipping`);
          continue;
        }

        const referencePrograms = programs
          .filter((program) => program.course.id === course.id)
          .toSorted((a, b) => b.degree.rang - a.degree.rang);

        const referenceProgram = referencePrograms[0];
        if (!referenceProgram) {
          console.warn(
            `No reference program for ${course.handle}, skipping C program`,
          );
          continue;
        }

        const referenceCurricula = await Curriculum.list({
          filter: {
            programId: referenceProgram.id,
            onlyCurrentActive: true,
          },
        });
        const referenceCurriculum = referenceCurricula[0];

        if (!referenceCurriculum) {
          console.warn(
            `No active curriculum for reference program ${referenceProgram.handle}, skipping`,
          );
          continue;
        }

        const referenceGearTypes = await Curriculum.GearType.list({
          filter: { curriculumId: referenceCurriculum.id },
        });

        if (referenceGearTypes.length === 0) {
          console.warn(
            `No gear types on reference curriculum ${referenceCurriculum.id}, skipping`,
          );
          continue;
        }

        const { id: programId } = await Course.Program.create({
          handle: programHandle,
          title: `${course.title ?? course.handle} C`,
          courseId: course.id,
          degreeId: degree.id,
        });

        const { id: curriculumId } = await Curriculum.create({
          programId,
          revision: "1",
        });

        for (const gearType of referenceGearTypes) {
          await Curriculum.GearType.linkToCurriculum({
            curriculumId,
            gearTypeId: gearType.id,
          });
        }

        await Curriculum.start({ curriculumId });

        console.log(
          `Created C program ${programHandle} with ${referenceGearTypes.length} gear type(s)`,
        );
      }
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
