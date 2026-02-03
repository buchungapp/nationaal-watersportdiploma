"use server";
import { revalidatePath } from "next/cache";
import pLimit from "p-limit";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { type ActorType, createPersonForLocation } from "~/lib/nwd";
import { dateInput } from "../dates";
import { actionClientWithMeta } from "../safe-action";
import { voidActionSchema } from "../utils";
import {
  COLUMN_MAPPING,
  type CSVData,
  countriesSchema,
  csvColumnLiteral,
  csvDataSchema,
  SELECT_LABEL,
} from "./person-bulk-csv-mappings";

const createPersonsSchema = zfd
  .formData(z.record(csvColumnLiteral, zfd.text()))
  .or(voidActionSchema);

const createPersonsArgsSchema: [
  locationId: z.ZodString,
  roles: z.ZodArray<
    z.ZodEnum<["student", "instructor", "location_admin"]>,
    "atleastone"
  >,
  csvData: typeof csvDataSchema,
  countries: typeof countriesSchema,
] = [
  z.string().uuid(),
  z.array(z.enum(["student", "instructor", "location_admin"])).nonempty(),
  csvDataSchema,
  countriesSchema,
];

type createPersonsStateActionType = {
  state: "parsed" | "submitted";
  columns?: string[];
  persons?: {
    email: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string;
    dateOfBirth: Date;
    birthCity: string;
    birthCountry: string;
  }[];
};

export const createPersonsAction = actionClientWithMeta
  .metadata({
    name: "create-persons",
  })
  .inputSchema(createPersonsSchema)
  .bindArgsSchemas(createPersonsArgsSchema)
  .stateAction<createPersonsStateActionType>(
    async (
      {
        parsedInput: data,
        bindArgsParsedInputs: [locationId, roles, csvData, countries],
      },
      { prevResult },
    ) => {
      if (prevResult.data?.state === "submitted") {
        return {
          state: "submitted",
        };
      }

      if (prevResult.data?.state === "parsed") {
        // biome-ignore lint/style/noNonNullAssertion: intentional
        return uploadPersons(locationId, roles, prevResult.data.persons!);
      }

      return parsePersonsFromCsvData(csvData, data, countries);
    },
  );

async function parsePersonsFromCsvData(
  csvData: CSVData,
  indexToColumnSelection: z.infer<typeof createPersonsSchema>,
  countries: z.infer<typeof countriesSchema>,
): Promise<createPersonsStateActionType> {
  if (!csvData || !csvData.rows) {
    throw new Error("Geen data gevonden.");
  }

  if (!indexToColumnSelection) {
    throw new Error("Geen kolommen gevonden.");
  }

  const selectedFields = Object.values(indexToColumnSelection).filter(
    (item) => item !== SELECT_LABEL,
  );
  const notSelectedIndices = Object.entries(indexToColumnSelection)
    .filter(([_, value]) => value === SELECT_LABEL)
    // biome-ignore lint/style/noNonNullAssertion: intentional
    .map(([key]) => Number.parseInt(key.split("-").pop()!, 10));

  const filteredData = csvData.rows.map((item) =>
    item.filter((_, index) => !notSelectedIndices.includes(index)),
  );

  const count = filteredData[0]?.length ?? 0;

  const requiredColumns = COLUMN_MAPPING;
  const expectedCount = requiredColumns.length;
  const missingFields = requiredColumns.filter(
    (item) => !selectedFields.includes(item),
  );

  if (missingFields.length > 0) {
    throw new Error(`Missende velden in data: ${missingFields.join(", ")}`);
  }

  if (count < expectedCount) {
    throw new Error("Je hebt minder kolommen geplakt dan verwacht.");
  }

  if (count > expectedCount) {
    throw new Error("Je hebt te veel kolommen geselecteerd.");
  }

  // Sort data so that we can parse it correctly.
  const indices = selectedFields.map((columnName) =>
    COLUMN_MAPPING.indexOf(columnName),
  );

  const sortedData = filteredData?.map((row) =>
    indices.map((index) => row[index]),
  );

  const personRowSchema = z
    .tuple([
      z.string().trim().toLowerCase().email(),
      z.string().trim(),
      z
        .string()
        .trim()
        .transform((v) => v || null),
      z.string(),
      dateInput,
      z.string(),
      z
        .preprocess(
          (value) => (value === "" ? "nl" : value),
          z.enum(countries.map((c) => c.code) as [string, ...string[]], {
            message: "Ongeldige landcode",
          }),
        )
        .default("nl"),
    ])
    .rest(z.string().nullish());

  const {
    success,
    data: rows,
    error,
  } = personRowSchema.array().safeParse(sortedData);

  if (!success) {
    throw new Error(
      `Er is een fout opgetreden bij het parsen van de data: ${JSON.stringify(
        error.flatten().fieldErrors,
      )}`,
    );
  }

  return {
    state: "parsed",
    persons: rows.map(
      ([
        email,
        firstName,
        lastNamePrefix,
        lastName,
        dateOfBirth,
        birthCity,
        birthCountry,
      ]) => ({
        email,
        firstName,
        lastNamePrefix,
        lastName,
        dateOfBirth,
        birthCity,
        birthCountry,
      }),
    ),
  };
}

async function uploadPersons(
  locationId: string,
  roles: [ActorType, ...ActorType[]],
  persons: NonNullable<createPersonsStateActionType["persons"]>,
): Promise<createPersonsStateActionType> {
  // Create a limit function that allows only 5 concurrent operations
  const limit = pLimit(5);

  const result = await Promise.allSettled(
    persons.map((row) =>
      limit(async () => await createPersonForLocation(locationId, roles, row)),
    ),
  );

  revalidatePath("/locatie/[location]/personen", "page");

  const rowsWithError = result.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (rowsWithError.length > 0) {
    rowsWithError.map((result) => console.error(result.reason));

    throw new Error(`
        ${rowsWithError.length} rows failed to import.
        ${rowsWithError.map((result) => result.reason).join("\n")}
      `);
  }

  return {
    state: "submitted",
  };
}
