import { stringify } from "csv-stringify/sync";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import dayjs from "~/lib/dayjs";
import { invariant } from "~/utils/invariant";

export type ExportFormatData =
  | {
      type: "csv";
    }
  | {
      type: "xlsx";
      sheetName: string;
    };

export type ExportFormat = ExportFormatData["type"];

export function exportDataToBlob(data: string | Buffer, format: ExportFormat) {
  if (format === "csv") {
    invariant(typeof data === "string", "CSV data is not a string");
    const utf8WithBom = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      ...Array.from(new TextEncoder().encode(data)),
    ]);
    const blob = new Blob([utf8WithBom], {
      type: "text/csv;charset=utf-8;",
    });
    return blob;
  }

  if (format === "xlsx") {
    invariant(Buffer.isBuffer(data), "XLSX data is not a buffer");
    const uint8Array = new Uint8Array(data);
    const blob = new Blob([uint8Array], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return blob;
  }

  invariant(false, "Invalid format");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.click();
  URL.revokeObjectURL(url);
}

export async function createExportData(
  headers: string[],
  rows: string[][],
  format: ExportFormatData,
): Promise<string | Buffer> {
  // Preprocess rows to handle formula-like values
  const processedRows = rows.map((row) =>
    row.map((value) => {
      // Check if value starts with any formula-like character
      if (value && typeof value === "string" && /^[=+\-@]/.test(value)) {
        return `'${value}`;
      }
      return value;
    }),
  );

  if (format.type === "csv") {
    return Promise.resolve(
      stringify([headers, ...processedRows], {
        header: false,
        quoted: true,
        quoted_empty: true,
        quoted_string: true,
        delimiter: ",",
      }),
    );
  }

  // For XLSX format
  return import("xlsx").then((XLSX) => {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...processedRows]);

    // Calculate column widths
    const colWidths = headers.map((header, colIndex) => {
      const headerWidth = header.length;
      const contentWidth = processedRows.reduce((max, row) => {
        const value = String(row[colIndex] || "");
        const lines = value.split(/\r\n|\n/);
        const maxLineLength = Math.max(...lines.map((line) => line.length));
        return Math.max(max, maxLineLength);
      }, 0);
      return { wch: Math.max(headerWidth, contentWidth) + 2, wrapText: true };
    });

    // Set column widths
    worksheet["!cols"] = colWidths;

    // Enable text wrapping for all cells
    for (let R = 0; R < processedRows.length + 1; ++R) {
      for (let C = 0; C < headers.length; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellRef]) continue;
        if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
        worksheet[cellRef].s.alignment = { wrapText: true, vertical: "top" };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, format.sheetName);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(buffer);
  });
}

// Transform records into arrays of strings in the same order as headers
export function transformRows(
  rows: Record<string, string>[],
  fields: { id: string }[],
) {
  return rows.map((row) => fields.map((field) => row[field.id] || ""));
}

// Helper type for field mapping functions
export type FieldMapper<T> = (data: T) => string;

export function mapToExportFields<T, M extends Record<string, FieldMapper<T>>>(
  data: T,
  fields: Extract<keyof M, string>[],
  fieldMappers: M,
  defaultValue = "",
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const fieldId of fields) {
    // Handle standard field mappings
    if (fieldId in fieldMappers) {
      const fieldmapper = fieldMappers[fieldId];
      invariant(fieldmapper, `Field mapper for ${fieldId} not found`);
      result[fieldId] = fieldmapper(data);
      continue;
    }

    // Default case
    result[fieldId] = defaultValue;
  }

  return result;
}

export function exportFileName(format: ExportFormat, title: string) {
  return `${dayjs().format("YYYY-MM-DDTHH:mm")}-${title}.${format}`;
}

// Helper functions for common transformations
const formatDate = (date: Date | string | null) =>
  date ? dayjs(date).format("DD-MM-YYYY") : "";

const formatDateTime = (date: Date | string | null) =>
  date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "";

const formatPhoneNumber = (phone: string | null) =>
  phone ? parsePhoneNumberFromString(phone)?.formatInternational() || "" : "";

const formatFullName = (
  firstName: string | null,
  lastNamePrefix: string | null,
  lastName: string | null,
) => [firstName, lastNamePrefix, lastName].filter(Boolean).join(" ");

const calculateAge = (
  birthDate: Date | string | null,
  eventDate: Date | string,
) =>
  birthDate ? String(dayjs(eventDate).diff(dayjs(birthDate), "years")) : "";

export const exportFormatters = {
  date: formatDate,
  dateTime: formatDateTime,
  phoneNumber: formatPhoneNumber,
  fullName: formatFullName,
  age: calculateAge,
};
