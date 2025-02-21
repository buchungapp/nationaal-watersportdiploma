"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createExternalCertificate } from "~/lib/nwd";

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

function extractFileExtension(file: File) {
  const name = file.name;
  const lastDot = name.lastIndexOf(".");

  return name.substring(lastDot);
}

export async function addExternalCertificate(
  {
    personId,
  }: {
    personId: string;
  },
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    media: z
      .custom<File>()
      .transform((file) =>
        file.size <= 0 || file.name === "undefined" ? null : file,
      )
      .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
        message: "The media must be a maximum of 5MB.",
      })
      .refine(
        (file) =>
          !file ||
          (file.type in ACCEPTED_IMAGE_TYPES &&
            ACCEPTED_IMAGE_TYPES[
              file.type as keyof typeof ACCEPTED_IMAGE_TYPES
            ].includes(extractFileExtension(file))),
        {
          message: "Only images are allowed to be sent.",
        },
      ),
    awardedAt: z.string().date().nullable().default(null),
    identifier: z.string().nullable().default(null),
    issuingAuthority: z.string().nullable().default(null),
    issuingLocation: z.string().nullable().default(null),
    title: z.string(),
    additionalComments: z.string().nullable().default(null),
  });

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
    const parsed = expectedSchema.parse(data);

    await createExternalCertificate({
      personId,
      media: parsed.media,
      externalCertificate: {
        ...parsed,
        metadata: null,
      },
    });

    revalidatePath("/profiel/[handle]", "page");

    return {
      message: "Success",
      errors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    return {
      message: "Error",
      errors: {},
    };
  }
}
