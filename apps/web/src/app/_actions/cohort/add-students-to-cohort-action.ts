"use server";

import { revalidatePath } from "next/cache";
import pLimit from "p-limit";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { addStudentToCohortByPersonId, setAllocationTags } from "~/lib/nwd";
import { createStudentForLocation } from "~/lib/nwd";
import { dateInput } from "../dates";
import {
  COLUMN_MAPPING_WITH_TAG,
  type CSVData,
  SELECT_LABEL,
  countriesSchema,
  csvColumnLiteral,
  csvDataSchema,
} from "../person/person-bulk-csv-mappings";
import { actionClientWithMeta } from "../safe-action";
import { voidActionSchema } from "../utils";

const addStudentsToCohortSchema = zfd
  .formData(z.record(csvColumnLiteral, zfd.text()))
  .or(voidActionSchema);

const addStudentsToCohortArgsSchema: [
  locationId: z.ZodString,
  cohortId: z.ZodString,
  csvData: typeof csvDataSchema,
  countries: typeof countriesSchema,
] = [z.string().uuid(), z.string().uuid(), csvDataSchema, countriesSchema];

type addStudentsToCohortStateActionType = {
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
    tags: string[];
  }[];
};

export const addStudentsToCohortAction = actionClientWithMeta
  .metadata({
    name: "add-students-to-cohort",
  })
  .inputSchema(addStudentsToCohortSchema)
  .bindArgsSchemas(addStudentsToCohortArgsSchema)
  .stateAction<addStudentsToCohortStateActionType>(
    async (
      {
        parsedInput: data,
        bindArgsParsedInputs: [locationId, cohortId, csvData, countries],
      },
      { prevResult },
    ) => {
      if (prevResult.data?.state === "submitted") {
        return {
          state: "submitted",
        };
      }

      if (prevResult.data?.state === "parsed") {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        return uploadPersons(locationId, cohortId, prevResult.data.persons!);
      }

      return parsePersonsFromCsvData(csvData, data, countries);
    },
  );

async function parsePersonsFromCsvData(
  csvData: CSVData,
  indexToColumnSelection: z.infer<typeof addStudentsToCohortSchema>,
  countries: z.infer<typeof countriesSchema>,
): Promise<addStudentsToCohortStateActionType> {
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
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    .map(([key]) => Number.parseInt(key.split("-").pop()!));

  const filteredData = csvData.rows.map((item) =>
    item.filter((_, index) => !notSelectedIndices.includes(index)),
  );

  const count = filteredData[0]?.length ?? 0;

  const requiredColumns = COLUMN_MAPPING_WITH_TAG.filter(
    (col) => col !== "Tag",
  );
  const minimalExpectedCount = requiredColumns.length;
  const missingFields = requiredColumns.filter(
    (item) => !selectedFields.includes(item),
  );

  if (missingFields.length > 0) {
    throw new Error(`Missende velden in data: ${missingFields.join(", ")}`);
  }

  if (count < minimalExpectedCount) {
    throw new Error("Je hebt minder kolommen geplakt dan verwacht.");
  }

  const nonTagColumns = COLUMN_MAPPING_WITH_TAG.filter((col) => col !== "Tag");

  // Sort the data for each tuple in filteredData so that it appears
  // in the order that we have in COLUMNS.
  const sortedData = filteredData.map((row) => {
    const sortedRow = Array(nonTagColumns.length).fill(null);
    const tags: string[] = [];

    row.forEach((value, index) => {
      const column = selectedFields[index];
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const columnIndex = nonTagColumns.indexOf(column as any);

      if (columnIndex !== -1) {
        sortedRow[columnIndex] = value;
      } else if (value && value.length > 0) {
        tags.push(value);
      }
    });

    return [...sortedRow, ...tags];
  });

  const calculateMaxLength = (data: string[][] | undefined): number => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map((row) => row.length));
  };

  const maxLength = calculateMaxLength(sortedData);
  const tagColumnsCount = Math.max(0, maxLength - nonTagColumns.length);

  const COLUMNS: string[] = [
    ...nonTagColumns,
    ...Array(tagColumnsCount).fill("Tag"),
  ];

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
    columns: COLUMNS,
    persons: rows.map(
      ([
        email,
        firstName,
        lastNamePrefix,
        lastName,
        dateOfBirth,
        birthCity,
        birthCountry,
        ...tags
      ]) => ({
        email,
        firstName,
        lastNamePrefix,
        lastName,
        dateOfBirth,
        birthCity,
        birthCountry,
        tags: tags.filter(Boolean) as string[],
      }),
    ),
  };
}

async function uploadPersons(
  locationId: string,
  cohortId: string,
  persons: NonNullable<addStudentsToCohortStateActionType["persons"]>,
): Promise<addStudentsToCohortStateActionType> {
  // Create a limit function that allows only 5 concurrent operations
  const limit = pLimit(5);

  const result = await Promise.allSettled(
    persons.map((row) =>
      limit(async () => {
        const person = await createStudentForLocation(locationId, row);

        const allocation = await addStudentToCohortByPersonId({
          cohortId,
          locationId,
          personId: person.id,
        });

        if (row.tags && row.tags.length > 0) {
          await setAllocationTags({
            allocationId: allocation.id,
            cohortId,
            tags: row.tags,
          });
        }

        return allocation;
      }),
    ),
  );

  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");

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
