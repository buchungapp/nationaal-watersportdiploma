"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createExternalCertificate,
  removeExternalCertificate,
  updateExternalCertificate,
} from "~/lib/nwd";

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

export async function createExternalCertificateAction(
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
      fields: {
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

export async function updateExternalCertificateAction(
  {
    personId,
    externalCertificateId,
  }: {
    personId: string;
    externalCertificateId: string;
  },
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    media: z
      .custom<File>()
      .transform((file) =>
        file.size <= 0 || file.name === "undefined" ? undefined : file,
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
      )
      .optional(),
    removeMedia: z
      .string()
      .transform((value) => value === "on")
      .optional(),
    awardedAt: z.string().date().nullable().default(null).optional(),
    identifier: z.string().nullable().default(null).optional(),
    issuingAuthority: z.string().nullable().default(null).optional(),
    issuingLocation: z.string().nullable().default(null).optional(),
    title: z.string().optional(),
    additionalComments: z.string().nullable().default(null).optional(),
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

    await updateExternalCertificate({
      id: externalCertificateId,
      personId,
      media: parsed.removeMedia ? null : parsed.media,
      fields: parsed,
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

export async function removeExternalCertificateAction({
  personId,
  externalCertificateId,
}: {
  personId: string;
  externalCertificateId: string;
}) {
  try {
    await removeExternalCertificate({
      personId,
      id: externalCertificateId,
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

export async function addMediaToExternalCertificateAction(
  {
    personId,
    externalCertificateId,
  }: {
    personId: string;
    externalCertificateId: string;
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
      .refine((file) => file !== null, {
        message: "A file must be uploaded",
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
          message: "Only images are allowed to be sent.",
        },
      ),
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

    await updateExternalCertificate({
      personId,
      media: parsed.media,
      id: externalCertificateId,
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
