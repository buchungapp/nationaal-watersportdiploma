import {
  Course,
  Curriculum,
  Location,
  Student,
  User,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import { array } from "@nawadi/lib";
import csv from "csvtojson";
import "dotenv/config";
import assert from "node:assert";
import path from "node:path";
import inquirer from "inquirer";
import { z } from "zod";
async function parseCsv(filePath: string) {
  try {
    const csvFilePath = path.resolve(filePath);
    const jsonArray = await csv({ delimiter: [",", ";"] }).fromFile(
      csvFilePath,
    );

    return jsonArray ?? [];
  } catch (error) {
    console.error("Error reading the CSV file:", error);
    throw error;
  }
}

async function main(filePath: string) {
  const entries = await parseCsv(filePath);

  const { location } = await inquirer.prompt([
    {
      type: "list",
      name: "location",
      message: "For which location would you like to create the certificates?",
      choices: async () => {
        const locations = await Location.list();

        return locations.map((location) => ({
          name: location.name,
          value: location.id,
        }));
      },
    },
  ]);

  const [allPrograms, allBoatTypes, allCurricula] = await Promise.all([
    Course.Program.list(),
    Curriculum.GearType.list(),
    Curriculum.list({
      filter: {
        onlyCurrentActive: true,
      },
    }),
  ]);

  const uniqueProgramHandles = new Set(
    allPrograms.map((program) => program.handle),
  );

  const uniqueBoatTypeHandles = new Set(
    allBoatTypes.map((boatType) => boatType.handle),
  );

  const rowSchema = z.object({
    "E-mailadres": z.string().trim().toLowerCase().email().optional(),
    Voornaam: z.string().trim(),
    Tussenvoegsels: z
      .string()
      .trim()
      .transform((tussenvoegsel) =>
        tussenvoegsel === "" ? null : tussenvoegsel,
      ),
    Achternaam: z.string(),
    Geboortedatum: z.string().pipe(z.coerce.date()),
    Geboorteplaats: z.string(),
    programma: z.string().refine((value) => uniqueProgramHandles.has(value), {
      message: "Program handle not found",
    }),
    materiaal: z.string().refine((value) => uniqueBoatTypeHandles.has(value), {
      message: "Gear type handle not found",
    }),
  });

  const erroredRows: z.output<typeof rowSchema>[] = [];

  const processRow = async (row: z.output<typeof rowSchema>) => {
    try {
      console.info(`Processing ${row.Voornaam} ${row.Achternaam}`);

      // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
      let user;

      if (row["E-mailadres"]) {
        user = await User.getOrCreateFromEmail({
          email: row["E-mailadres"],
          displayName: row.Voornaam,
        });
      }

      const person = await User.Person.getOrCreate({
        userId: user?.id,
        firstName: row.Voornaam,
        lastName: row.Achternaam,
        lastNamePrefix: row.Tussenvoegsels,
        dateOfBirth: row.Geboortedatum.toISOString(),
        birthCity: row.Geboorteplaats,
        birthCountry: "nl",
      });

      await User.Person.createLocationLink({
        personId: person.id,
        locationId: location,
      });

      await User.Actor.upsert({
        locationId: location,
        type: "student",
        personId: person.id,
      });

      const program = array.findItem({
        items: allPrograms,
        predicate: (program) => program.handle === row.programma,
        enforce: true,
      });

      const curriculum = array.findItem({
        items: allCurricula,
        predicate: (curriculum) => curriculum.programId === program.id,
        enforce: true,
      });

      const gearTypes = await Curriculum.GearType.list({
        filter: {
          handle: row.materiaal,
          curriculumId: curriculum.id,
        },
      });

      assert(gearTypes.length === 1, "Gear type not found for curriculum");
      const [gearType] = gearTypes;
      assert.ok(gearType, "Gear type not found for curriculum");

      // Add new line to console
      console.log("-----------------------------------");

      const { modules } = await inquirer.prompt([
        {
          type: "checkbox",
          name: "modules",
          message: `Select the modules that have been completed for ${row.Voornaam} ${row.Achternaam}`,
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
        personId: person.id,
        gearTypeId: gearType.id,
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
    } catch (error) {
      erroredRows.push(row);
      console.error(
        `Error processing ${row.Voornaam} ${row.Achternaam}:`,
        error,
      );
      console.info("Continuing with the next row");
    }
  };

  const normalizedEntries = entries.filter((entry) => {
    // At least one value is required
    return !!entry && Object.values(entry).some((value) => value !== "");
  });

  const parseResult = rowSchema.array().safeParse(normalizedEntries);

  if (!parseResult.success) {
    console.error("Error parsing the CSV file:", parseResult.error.flatten());
    process.exit(1);
  }

  const rows = parseResult.data;

  for await (const row of rows) {
    await processRow(row);
  }

  if (erroredRows.length > 0) {
    console.error("The following rows could not be processed:");
    console.table(
      erroredRows.map((row) => ({
        Voornaam: row.Voornaam,
        Achternaam: row.Achternaam,
      })),
    );
  }
}

const pgUri = process.env.PGURI;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert(pgUri, "PGURI environment variable is required");
assert(
  supabaseUrl,
  "NEXT_PUBLIC_SUPABASE_URL environment variable is required",
);
assert(
  supabaseKey,
  "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
);

withSupabaseClient(
  {
    url: supabaseUrl,
    serviceRoleKey: supabaseKey,
  },
  () =>
    withDatabase(
      {
        connectionString: pgUri,
      },
      async () => {
        // Get the file path from the command-line arguments
        const filePath = process.argv[2];

        // Check if the file path was provided
        if (!filePath) {
          console.log("Please provide a file path.");
          process.exit(1);
        }

        await main(filePath);
      },
    )
      .then(() => {
        console.log("Done!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
      }),
);
