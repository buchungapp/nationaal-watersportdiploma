import { z } from "zod";
import {
  COLUMN_MAPPING,
  type CSVData,
  SELECT_LABEL,
} from "./person-bulk-csv-mappings";

function validUtcDate(year: number, month: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseBirthDate(value: string): Date | null {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    return validUtcDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const dutch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed);
  if (dutch) {
    return validUtcDate(Number(dutch[3]), Number(dutch[2]), Number(dutch[1]));
  }

  return null;
}

const dateOfBirthInput = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const date = parseBirthDate(value);
    if (!date) {
      ctx.addIssue({
        code: "custom",
        message: "Ongeldige geboortedatum",
      });
      return z.NEVER;
    }
    return date;
  });

const personRowSchema = z
  .tuple([
    z.string().trim().toLowerCase().email(),
    z.string().trim(),
    z
      .string()
      .trim()
      .transform((v) => v || null),
    z.string(),
    dateOfBirthInput,
    z.string(),
    z
      .preprocess((value) => (value === "" ? "nl" : value), z.string().min(2))
      .default("nl"),
  ])
  .rest(z.string().nullish());

type PersonColumn = (typeof COLUMN_MAPPING)[number];
type CountryOption = { code: string };

export type ParsedPersonRow = {
  rowIndex: number;
  email: string;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string;
  dateOfBirth: Date;
  birthCity: string;
  birthCountry: string;
  // Tags collected from any columns the operator mapped to "Tag" — only
  // populated when the dialog is using COLUMN_MAPPING_WITH_TAG (cohort
  // variant). Empty when the column mapping has no Tag entry.
  tags: string[];
};

export type BulkImportParseError = {
  rowIndex: number;
  error: string;
  values: string[];
};

function sourceIndexFromKey(key: string): number {
  // biome-ignore lint/style/noNonNullAssertion: include-column-N format
  return Number.parseInt(key.split("-").pop()!, 10);
}

export function parseRowsTolerant(
  csvData: CSVData,
  indexToColumnSelection: Record<string, string>,
  countries: CountryOption[],
): {
  parsedRows: ParsedPersonRow[];
  parseErrors: BulkImportParseError[];
} {
  if (!csvData || !csvData.rows) {
    throw new Error("Geen data gevonden.");
  }

  // Build a target -> source lookup. Operators may paste columns in any
  // order, and cohort imports may place Tag columns before or between
  // person fields.
  const sourceIndexByTarget = new Map<PersonColumn, number>();
  const tagIndices: number[] = [];

  for (const [key, value] of Object.entries(indexToColumnSelection)) {
    const sourceIndex = sourceIndexFromKey(key);
    if (value === "Tag") {
      tagIndices.push(sourceIndex);
      continue;
    }
    if (value === SELECT_LABEL) {
      continue;
    }
    if ((COLUMN_MAPPING as readonly string[]).includes(value)) {
      sourceIndexByTarget.set(value as PersonColumn, sourceIndex);
    }
  }

  tagIndices.sort((a, b) => a - b);

  const missingFields = COLUMN_MAPPING.filter(
    (field) => !sourceIndexByTarget.has(field),
  );

  if (missingFields.length > 0) {
    throw new Error(`Missende velden in data: ${missingFields.join(", ")}`);
  }

  const allowedCountries = new Set(
    countries.map((c) => c.code.trim().toLowerCase()),
  );

  const parsedRows: ParsedPersonRow[] = [];
  const parseErrors: BulkImportParseError[] = [];

  csvData.rows.forEach((row, rowIndex) => {
    const sortedRow = COLUMN_MAPPING.map((field) => {
      const sourceIndex = sourceIndexByTarget.get(field);
      return sourceIndex === undefined ? undefined : row[sourceIndex];
    });
    const rawValues = sortedRow.map((v) => v ?? "");
    const parsed = personRowSchema.safeParse(sortedRow);
    if (!parsed.success) {
      parseErrors.push({
        rowIndex,
        error: JSON.stringify(parsed.error.flatten().fieldErrors),
        values: rawValues,
      });
      return;
    }
    const [
      email,
      firstName,
      lastNamePrefix,
      lastName,
      dateOfBirth,
      birthCity,
      birthCountry,
    ] = parsed.data;
    const normalizedBirthCountry = birthCountry.trim().toLowerCase();
    if (!allowedCountries.has(normalizedBirthCountry)) {
      parseErrors.push({
        rowIndex,
        error: `Ongeldige landcode: ${birthCountry}`,
        values: rawValues,
      });
      return;
    }

    const seenTags = new Set<string>();
    const tags: string[] = [];
    for (const idx of tagIndices) {
      const value = row[idx];
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (!trimmed || seenTags.has(trimmed)) continue;
      seenTags.add(trimmed);
      tags.push(trimmed);
    }

    parsedRows.push({
      rowIndex,
      tags,
      email,
      firstName,
      lastNamePrefix,
      lastName,
      dateOfBirth,
      birthCity,
      birthCountry: normalizedBirthCountry,
    });
  });

  return { parsedRows, parseErrors };
}
