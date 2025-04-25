import {
  Course,
  Curriculum,
  useQuery,
  withDatabase,
  withSupabaseClient,
  withTransaction,
} from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import { schema } from "@nawadi/db";
import slugify from "@sindresorhus/slugify";
import { eq } from "drizzle-orm";
import inquirer from "inquirer";
import pkg from "xlsx";
import { z } from "zod";

const { readFile, utils } = pkg;

// Cache for program lookups
const programCache = new Map<
  string,
  ReturnType<typeof Course.Program.fromHandle>
>();

// Cache for module upsert operations
const moduleUpsertCache = new Map<string, Promise<string>>();

// Cache for competency upsert operations
const competencyUpsertCache = new Map<string, Promise<string>>();

// Cache for curriculum creation operations
const curriculumCache = new Map<string, Promise<{ id: string }>>();

interface RowData {
  vaarwater: string;
  niveau: string;
  module: string;
  type: string;
  competentie: string;
  eis: string;
}

interface ValidationError {
  row: number;
  data: RowData;
  errors: z.ZodError["errors"];
}

const rowSchema = z.tuple([
  z.preprocess(
    (val) => String(val).trim(),
    z.union([
      z.literal("Binnenwater"),
      z.literal("Ruim Binnenwater"),
      z.literal("Waddenzee en Zeeuwse Stromen"),
      z.literal("Zee"),
    ]),
  ),
  z.preprocess((val) => {
    // Extract number from string
    const match = String(val).match(/\d+/);
    return match ? Number(match[0]) : "";
  }, z.number().int().min(1).max(4)),
  z.string().trim(),
  z.preprocess(
    (val) => String(val).trim(),
    z.union([z.literal("Kern"), z.literal("Keuze")]),
  ),
  z.string().trim(),
  z.string().trim(),
]);

async function main() {
  // Ask user for the XLSX file path
  const { filePath } = await inquirer.prompt([
    {
      type: "input",
      name: "filePath",
      message: "Enter the path to the XLSX file:",
      default: "/Users/techmaus/Downloads/brondbestand-jachtzeilen.xlsx",
      validate: (input) => {
        if (!input) return "Please enter a file path";
        if (!input.endsWith(".xlsx")) return "File must be an XLSX file";
        return true;
      },
    },
  ]);

  // Read the XLSX file
  const workbook = readFile(filePath);

  // Get the first sheet
  if (!workbook.SheetNames.length) {
    throw new Error("No sheets found in the XLSX file");
  }
  const sheetName = workbook.SheetNames[0];
  assert(sheetName, "Sheet name is required");

  const worksheet = workbook.Sheets[sheetName];
  assert(worksheet, "Worksheet is required");

  // Convert to JSON
  const data = utils.sheet_to_json<RowData>(worksheet);

  console.log("Successfully read XLSX file");
  console.log(`Found ${data.length} rows of data`);

  // Process each row with the schema
  const processedRows = [];
  const validationErrors: ValidationError[] = [];

  for (const [index, row] of data.entries()) {
    try {
      // Convert row object to array in the correct order
      const rowArray = [
        row.vaarwater,
        row.niveau,
        row.module,
        row.type,
        row.competentie,
        row.eis,
      ];

      const validatedRow = rowSchema.parse(rowArray);
      processedRows.push(validatedRow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        validationErrors.push({
          row: index + 1,
          data: row,
          errors: error.errors,
        });
      } else {
        throw error;
      }
    }
  }

  // Log results
  console.log(`\nSuccessfully processed ${processedRows.length} rows`);
  if (validationErrors.length > 0) {
    console.log(`\nFound ${validationErrors.length} validation errors:`);
    for (const { row, data, errors } of validationErrors) {
      console.log(`\nRow ${row}:`);
      console.log("Data:", data);
      console.log(
        "Errors:",
        errors.map((e: z.ZodIssue) => {
          const field = e.path[0];

          if (!field) {
            return `Unknown field: ${e.message}`;
          }

          const fieldName =
            {
              0: "Vaarwater",
              1: "Niveau",
              2: "Module",
              3: "Type",
              4: "Competentie",
              5: "Eis",
            }[field] || field;
          return `${fieldName}: ${e.message}`;
        }),
      );
    }
  }

  for (const row of processedRows) {
    const [
      vaarwater,
      niveau,
      moduleWithWeight,
      type,
      competentieWithWeight,
      eis,
    ] = row;

    const programHandle = `jacht-kajuitzeilen-${slugify(vaarwater)}-volwassenen-${niveau}`;

    // Strip the numbered prefix (e.g., "1. " or "1.2. ") from the start
    const moduleWithoutWeight = moduleWithWeight.replace(/^\d+\.\s*/, "");
    const competentieWithoutWeight = competentieWithWeight.replace(
      /^\d+\.\s*/,
      "",
    );

    // Extract the number from the start
    const moduleWeight = moduleWithWeight.match(/^(\d+)/)?.[1] || "";
    const competentieWeight = competentieWithWeight.match(/^(\d+)/)?.[1] || "";

    const moduleWeightNumber = Number(moduleWeight);
    const competentieWeightNumber = Number(competentieWeight);

    assert(moduleWithoutWeight, "Module without weight is required");
    assert(competentieWithoutWeight, "Competentie without weight is required");
    assert(moduleWeightNumber, "Module weight is required");
    assert(competentieWeightNumber, "Competentie weight is required");
    const overwriteModuleHandle = {
      "basis-jz": "basis-jz",
      "theorie-jz": "theorie-jz",
    }[slugify(moduleWithoutWeight)];

    const moduleHandle = overwriteModuleHandle || slugify(moduleWithoutWeight);
    const competentieHandle = slugify(competentieWithoutWeight);

    // Get program from cache or fetch it
    let programPromise = programCache.get(programHandle);
    if (!programPromise) {
      programPromise = Course.Program.fromHandle(programHandle);
      programCache.set(programHandle, programPromise);
    }

    let program: Awaited<ReturnType<typeof Course.Program.fromHandle>>;
    try {
      program = await programPromise;
      assert(program, "Program is expected to exist");
    } catch (error) {
      console.error(`Program not found: ${programHandle}`);
      continue;
    }

    const upsertModule = async () => {
      const cacheKey = `${moduleHandle}-${moduleWeightNumber}`;
      let upsertPromise = moduleUpsertCache.get(cacheKey);

      if (!upsertPromise) {
        upsertPromise = (async () => {
          const module = await Course.Module.fromHandle(moduleHandle);

          if (module) {
            await useQuery()
              .update(schema.module)
              .set({
                weight: moduleWeightNumber,
              })
              .where(eq(schema.module.id, module.id));

            return module.id;
          }

          const result = await Course.Module.create({
            handle: moduleHandle,
            title: moduleWithoutWeight,
            weight: moduleWeightNumber,
          });

          return result.id;
        })();

        moduleUpsertCache.set(cacheKey, upsertPromise);
      }

      return upsertPromise;
    };

    const upsertCompetentie = async () => {
      const cacheKey = `${competentieHandle}-${competentieWeightNumber}-${moduleWithoutWeight}`;
      let upsertPromise = competencyUpsertCache.get(cacheKey);

      if (!upsertPromise) {
        upsertPromise = (async () => {
          const competentie =
            await Course.Competency.fromHandle(competentieHandle);

          if (competentie) {
            if (competentie.weight > 1) {
              // This competency is also used in youth disciplines
              return competentie.id;
            }

            await useQuery()
              .update(schema.competency)
              .set({
                weight: competentieWeightNumber,
              })
              .where(eq(schema.competency.id, competentie.id));

            return competentie.id;
          }

          const result = await Course.Competency.create({
            handle: competentieHandle,
            title: competentieWithoutWeight,
            type: moduleWithoutWeight === "Theorie" ? "knowledge" : "skill",
          });

          return result.id;
        })();

        competencyUpsertCache.set(cacheKey, upsertPromise);
      }

      return upsertPromise;
    };

    const [moduleId, competentieId] = await Promise.all([
      upsertModule(),
      upsertCompetentie(),
    ]);

    const curriculumCacheKey = `${program.id}-202501`;
    let curriculumPromise = curriculumCache.get(curriculumCacheKey);

    if (!curriculumPromise) {
      curriculumPromise = Curriculum.create({
        programId: program.id,
        revision: "202501",
      });
      curriculumCache.set(curriculumCacheKey, curriculumPromise);
    }

    const { id: curriculumId } = await curriculumPromise;

    await Curriculum.linkModule({
      curriculumId,
      moduleId,
    }).catch((error) => {
      console.error(
        `Error linking module: ${moduleId} to curriculum: ${curriculumId}`,
      );
      //   ignore duplicate keys
    });

    await Curriculum.Competency.create({
      curriculumId,
      moduleId,
      competencyId: competentieId,
      isRequired: type === "Kern",
      requirement: eis,
    });
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
        await withTransaction(async () => {
          await main();
        });
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
