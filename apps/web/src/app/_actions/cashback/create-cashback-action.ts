"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { createCashback, listAllActiveLocations } from "~/lib/nwd";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  extractFileExtension,
} from "../files";
import { smellsLikeIban, validateIbanChecksum } from "../iban";
import { actionClientWithMeta } from "../safe-action";

const createCashbackSchema = zfd.formData({
  applicantFullName: zfd.text(z.string().min(1, "Naam is verplicht")),
  applicantEmail: zfd.text(z.string().email("Ongeldig e-mailadres")),
  studentFullName: zfd.text(z.string().min(1, "Naam is verplicht")),
  verificationMedia: zfd.file(
    z
      .custom<File>()
      .transform((file) =>
        file.size <= 0 || file.name === "undefined" ? null : file,
      )
      .refine((file) => file !== null, {
        message: "Media is verplicht",
      })
      .refine((file) => file.size <= MAX_FILE_SIZE, {
        message: `De media moet een maximum van ${MAX_FILE_SIZE / 1000000}MB zijn.`,
      })
      .refine(
        (file) =>
          file.type in ACCEPTED_IMAGE_TYPES &&
          ACCEPTED_IMAGE_TYPES[
            file.type as keyof typeof ACCEPTED_IMAGE_TYPES
          ].includes(extractFileExtension(file)),
        {
          message: "Alleen afbeeldingen of PDF's zijn toegestaan.",
        },
      ),
  ),
  verificationLocation: zfd.text(z.string().min(1, "Vaarlocatie is verplicht")),
  bookingLocationId: zfd.text(
    z
      .string()
      .uuid("Vaarlocatie is verplicht")
      .refine(
        async (id) => {
          const locations = await listAllActiveLocations();
          return locations.some((location) => location.id === id);
        },
        {
          message: "Ongeldige vaarlocatie",
        },
      ),
  ),
  bookingNumber: zfd.text(z.string().min(1, "Boekingsnummer is verplicht")),
  applicantIban: zfd.text(
    z
      .string()
      .refine((str) => smellsLikeIban(str), "Ongeldig IBAN formaat")
      .refine((str) => validateIbanChecksum(str), "Ongeldig IBAN nummer")
      .transform((str) => str.replace(/[\s-]/g, "")),
  ),
  terms: zfd
    .checkbox()
    .refine((value) => value, "Je moet akkoord gaan met de voorwaarden"),
  newsletter: zfd.checkbox(),
});

export const createCashbackAction = actionClientWithMeta
  .metadata({
    name: "create-cashback",
  })
  .schema(createCashbackSchema)
  .action(async ({ parsedInput: { verificationMedia, terms, ...fields } }) => {
    const cashback = await createCashback({
      media: verificationMedia,
      fields,
    });

    return cashback;
  });
