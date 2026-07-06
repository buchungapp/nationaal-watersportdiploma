import {
  type KwalificatieImportRow,
  kwalificatieRichtingSchema,
} from "@nawadi/core";
import type { CSVData } from "../person/person-bulk-csv-mappings";
import { SELECT_LABEL } from "../person/person-bulk-csv-mappings";

export const KWALIFICATIE_COLUMN_MAPPING = [
  "E-mailadres",
  "NWD-id",
  "Cursus",
  "Richting",
  "Niveau",
  "Kerntaak",
  "Opmerkingen",
] as const;

export type KwalificatieParseError = {
  rowIndex: number;
  error: string;
};

export type KwalificatieParseResult = {
  rows: KwalificatieImportRow[];
  parseErrors: KwalificatieParseError[];
};

export function parseKwalificatieRows(
  csvData: CSVData,
  indexToColumnSelection: Record<string, string>,
): KwalificatieParseResult {
  const rows: KwalificatieImportRow[] = [];
  const parseErrors: KwalificatieParseError[] = [];

  if (!csvData.rows) {
    return { rows, parseErrors };
  }

  const columnIndexToField = new Map<number, string>();
  for (const [key, value] of Object.entries(indexToColumnSelection)) {
    if (value === SELECT_LABEL) continue;
    const match = /^include-column-(\d+)$/.exec(key);
    if (match?.[1]) {
      columnIndexToField.set(Number(match[1]), value);
    }
  }

  for (let i = 0; i < csvData.rows.length; i++) {
    const rawRow = csvData.rows[i];
    if (!rawRow) continue;

    const fields: Record<string, string> = {};
    for (const [colIndex, fieldName] of columnIndexToField) {
      const val = rawRow[colIndex]?.trim();
      if (val) fields[fieldName] = val;
    }

    const rowIndex = i + 1;
    const email = fields["E-mailadres"]?.toLowerCase();
    const nwdId = fields["NWD-id"];
    const courseTitle = fields.Cursus;
    const richtingRaw = fields.Richting?.toLowerCase();
    const niveauRaw = fields.Niveau;
    const kerntaakTitel = fields.Kerntaak;
    const opmerkingen = fields.Opmerkingen;

    if (!email && !nwdId) {
      parseErrors.push({
        rowIndex,
        error: "E-mailadres of NWD-id is verplicht",
      });
      continue;
    }

    if (!courseTitle) {
      parseErrors.push({ rowIndex, error: "Cursus is verplicht" });
      continue;
    }

    const richtingResult = kwalificatieRichtingSchema.safeParse(richtingRaw);
    if (!richtingResult.success) {
      parseErrors.push({
        rowIndex,
        error: "Richting moet instructeur, leercoach of pvb_beoordelaar zijn",
      });
      continue;
    }

    const niveau = Number(niveauRaw);
    if (!Number.isInteger(niveau) || niveau < 1 || niveau > 5) {
      parseErrors.push({
        rowIndex,
        error: "Niveau moet een geheel getal tussen 1 en 5 zijn",
      });
      continue;
    }

    rows.push({
      rowIndex,
      email,
      nwdId,
      courseTitle,
      richting: richtingResult.data,
      niveau,
      kerntaakTitel,
      opmerkingen,
    });
  }

  return { rows, parseErrors };
}
