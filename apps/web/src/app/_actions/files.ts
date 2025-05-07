import { z } from "zod";
import { zfd } from "zod-form-data";

export const MAX_FILE_SIZE = 5_000_000;
export const ACCEPTED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
};

export function extractFileExtension(file: File) {
  const name = file.name;
  const lastDot = name.lastIndexOf(".");

  return name.substring(lastDot);
}

const basicFileSchema = zfd.file(
  z
    .custom<File>()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      `Het bestand mag maximaal ${Math.floor(MAX_FILE_SIZE / 1000000)}MB groot zijn.`,
    )
    .refine(
      (file) =>
        !file ||
        (file.type in ACCEPTED_IMAGE_TYPES &&
          ACCEPTED_IMAGE_TYPES[
            file.type as keyof typeof ACCEPTED_IMAGE_TYPES
          ].includes(extractFileExtension(file))),
      "Alleen afbeeldingen of PDF's zijn toegestaan.",
    ),
);

export const optionalNullableFileSchema = basicFileSchema.optional().nullable();

export const optionalFileSchema = basicFileSchema
  .optional()
  .refine(
    (file) => file !== null,
    "Alleen een bestand of undefined is toegestaan.",
  );

export const nullableFileSchema = basicFileSchema
  .nullable()
  .refine(
    (file) => file !== undefined,
    "Alleen een bestand of null is toegestaan.",
  );

export const requiredFileSchema = basicFileSchema.refine(
  (file) => file !== undefined && file !== null,
  "Een bestand moet geselecteerd worden.",
);
