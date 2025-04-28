import {
  Course,
  Curriculum,
  Location,
  Student,
  User,
  withDatabase,
} from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import inquirer from "inquirer";

async function main() {
  const { location, person, programHandle } = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message: "Select the location",
      choices: async () => {
        const locations = await Location.list();

        return locations.map((location) => ({
          name: location.name,
          value: location.id,
        }));
      },
    },
    {
      type: "list",
      name: "person",
      message: "For which person would you like to add a certificate?",
      choices: async (answers) => {
        const persons = await User.Person.list({
          filter: { locationId: answers.location },
        });

        return persons.map((person) => ({
          name: `${[person.firstName, person.lastNamePrefix, person.lastName].filter(Boolean).join(" ")}`,
          value: person.id,
        }));
      },
    },
    {
      type: "input",
      name: "programHandle",
      message: "Give the program handle",
    },
  ]);

  const program = await Course.Program.fromHandle(programHandle);

  assert(program, "Program not found");

  const { id: programId } = program;

  const curricula = await Curriculum.list({
    filter: {
      programId: programId,
      onlyCurrentActive: true,
    },
  });

  assert.strictEqual(curricula.length, 1, "Curriculum not found");

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const curriculum = curricula[0]!;

  const { gearType, modules } = await inquirer.prompt([
    {
      type: "list",
      name: "gearType",
      message: "Which gear type would you like to attach to the certificate?",
      choices: async () => {
        const gearTypes = await Curriculum.GearType.list({
          filter: {
            curriculumId: curriculum.id,
          },
        });

        return gearTypes.map((gearType) => ({
          name: gearType.title,
          value: gearType.id,
        }));
      },
    },
    {
      type: "checkbox",
      name: "modules",
      message: "Select the modules that have been completed",
      choices: () => {
        return curriculum.modules.map((module) => ({
          name: module.title,
          value: module.competencies.map((competency) => competency.id),
          checked: module.isRequired,
        }));
      },
    },
  ]);

  // Start student curriculum
  const { id: studentCurriculumId } = await Student.Curriculum.start({
    curriculumId: curriculum.id,
    personId: person,
    gearTypeId: gearType,
  });

  // Start certificate
  const { id: certificateId } = await Student.Certificate.startCertificate({
    locationId: location,
    studentCurriculumId,
  });

  // Add completed competencies
  await Student.Certificate.completeCompetency({
    certificateId,
    studentCurriculumId,
    competencyId: modules.flat(),
  });

  // Complete certificate
  await Student.Certificate.completeCertificate({
    certificateId,
    visibleFrom: new Date().toISOString(),
  });
}

const pgUri = process.env.PGURI;

if (!pgUri) {
  throw new Error("PGURI environment variable is required");
}

withDatabase(
  {
    connectionString: pgUri,
  },
  async () => await main(),
)
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
