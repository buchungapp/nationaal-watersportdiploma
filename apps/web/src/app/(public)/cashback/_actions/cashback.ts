"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCashback, listAllLocations } from "~/lib/nwd";

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
};

function extractFileExtension(file: File) {
  const name = file.name;
  const lastDot = name.lastIndexOf(".");

  return name.substring(lastDot);
}

function smellsLikeIban(str: string) {
  return /^([A-Z]{2}[ \-]?[0-9]{2})(?=(?:[ \-]?[A-Z0-9]){9,30}$)((?:[ \-]?[A-Z0-9]{3,5}){2,7})([ \-]?[A-Z0-9]{1,3})?$/.test(
    str,
  );
}

function validateIbanChecksum(iban: string): boolean {
  const ibanStripped = iban
    .replace(/[^A-Z0-9]+/gi, "") //keep numbers and letters only
    .toUpperCase(); //calculation expects upper-case
  const m = ibanStripped.match(/^([A-Z]{2})([0-9]{2})([A-Z0-9]{9,30})$/);
  if (!m || !m[3] || !m[1] || !m[2]) return false;

  const numbericed = (m[3] + m[1] + m[2]).replace(/[A-Z]/g, (ch: string) => {
    //replace upper-case characters by numbers 10 to 35
    return String(ch.charCodeAt(0) - 55);
  });
  //The resulting number would be to long for javascript to handle without loosing precision.
  //So the trick is to chop the string up in smaller parts.
  const mod97 = numbericed
    .match(/\d{1,7}/g)
    ?.reduce(
      (total: string, curr: string) => String(Number(total + curr) % 97),
      "",
    );

  return mod97 === "1";
}
const expectedSchema = z.object({
  applicantFullName: z.string().min(1, "Naam is verplicht"),
  applicantEmail: z.string().email("Ongeldig e-mailadres"),
  studentFullName: z.string().min(1, "Naam is verplicht"),
  verificationMedia: z
    .custom<File>()
    .transform((file) =>
      file.size <= 0 || file.name === "undefined" ? null : file,
    )
    .refine((file) => file !== null, {
      message: "Media is verplicht",
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "The media must be a maximum of 5MB.",
    })
    .refine(
      (file) =>
        file.type in ACCEPTED_IMAGE_TYPES &&
        ACCEPTED_IMAGE_TYPES[
          file.type as keyof typeof ACCEPTED_IMAGE_TYPES
        ].includes(extractFileExtension(file)),
      {
        message: "Only images or pdf's are allowed to be sent.",
      },
    ),
  verificationLocation: z.string().min(1, "Vaarlocatie is verplicht"),
  bookingLocationId: z
    .string()
    .min(1, "Vaarlocatie is verplicht")
    .refine(
      async (id) => {
        const locations = await listAllLocations();
        return locations.some((location) => location.id === id);
      },
      {
        message: "Ongeldige vaarlocatie",
      },
    ),
  bookingNumber: z.string().min(1, "Boekingsnummer is verplicht"),
  applicantIban: z
    .string()
    .refine((str) => smellsLikeIban(str), "Ongeldig IBAN formaat")
    .refine((str) => validateIbanChecksum(str), "Ongeldig IBAN nummer"),
  terms: z.literal("on", {
    errorMap: () => ({ message: "Je moet akkoord gaan met de voorwaarden" }),
  }),
  newsletter: z.preprocess((value) => value === "on", z.boolean()),
});

export async function createCashbackAction(
  prevState: unknown,
  formData: FormData,
) {
  const data: Record<string, FormDataEntryValue | null> = Object.fromEntries(
    formData.entries(),
  );

  // Set all empty strings to null
  for (const key in data) {
    if (data[key] === "") {
      data[key] = null;
    }
  }

  try {
    const parsed = await expectedSchema.parseAsync(data);

    await createCashback({
      media: parsed.verificationMedia,
      fields: parsed,
    });

    revalidatePath("/cashback", "page");

    return {
      message: "Success",
      fields: {},
      errors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        fields: {
          ...data,
          verificationMedia: String(Date.now()),
          newsletter: data.newsletter ?? "off",
        } as Record<string, FormDataEntryValue | null>,
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    console.log(error);

    return {
      message: "Error",
      fields: {
        ...data,
        verificationMedia: String(Date.now()),
        newsletter: data.newsletter ?? "off",
      } as Record<string, FormDataEntryValue | null>,
      errors: {},
    };
  }
}
