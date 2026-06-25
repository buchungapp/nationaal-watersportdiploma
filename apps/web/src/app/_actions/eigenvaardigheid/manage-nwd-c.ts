"use server";

import { Certificate, Course, Curriculum, Location } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const registerNwdCSchema = z.object({
  personId: z.string().uuid(),
  curriculumId: z.string().uuid(),
  gearTypeId: z.string().uuid(),
  locationId: z.string().uuid(),
  issuedAt: z.string().datetime(),
  opmerkingen: z.string().optional(),
});

export const registerNwdCAction = actionClientWithMeta
  .metadata({ name: "eigenvaardigheid.register-nwd-c" })
  .inputSchema(registerNwdCSchema)
  .action(async ({ parsedInput: input }) => {
    const user = await getUserOrThrow();

    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang tot deze functie");
    }

    const actor = user.persons[0]?.actors.find((a) => a.type === "system");

    const result = await Certificate.registerNwdC({
      personId: input.personId,
      curriculumId: input.curriculumId,
      gearTypeId: input.gearTypeId,
      locationId: input.locationId,
      issuedAt: input.issuedAt,
      visibleFrom: input.issuedAt,
      opmerkingen: input.opmerkingen,
      toegevoegdDoor: actor?.id,
    });

    revalidatePath(`/secretariaat/instructeur/${input.personId}`);

    return { success: true, certificateId: result.id };
  });

const removeNwdCSchema = z.object({
  personId: z.string().uuid(),
  certificateId: z.string().uuid(),
});

export const removeNwdCAction = actionClientWithMeta
  .metadata({ name: "eigenvaardigheid.remove-nwd-c" })
  .inputSchema(removeNwdCSchema)
  .action(async ({ parsedInput: input }) => {
    const user = await getUserOrThrow();

    if (!isSystemAdmin(user.email)) {
      throw new Error("Geen toegang tot deze functie");
    }

    await Certificate.withdrawNwdC({
      certificateId: input.certificateId,
      personId: input.personId,
    });

    revalidatePath(`/secretariaat/instructeur/${input.personId}`);

    return { success: true };
  });

export async function getNwdCPrograms() {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email)) {
    throw new Error("Geen toegang tot deze functie");
  }

  const degree = await Course.Degree.fromHandle(
    Certificate.NWD_C_DEGREE_HANDLE,
  );
  if (!degree) {
    return [];
  }

  const programs = await Course.Program.list({});
  const nwdCPrograms = programs.filter(
    (program) => program.degree.id === degree.id,
  );

  const programsWithCurriculum = await Promise.all(
    nwdCPrograms.map(async (program) => {
      const curricula = await Curriculum.list({
        filter: { programId: program.id, onlyCurrentActive: true },
      });

      return {
        id: program.id,
        handle: program.handle,
        title: program.title,
        course: {
          id: program.course.id,
          handle: program.course.handle,
          title: program.course.title,
          discipline: program.course.discipline,
        },
        curriculum: curricula[0]
          ? {
              id: curricula[0].id,
              revision: curricula[0].revision,
            }
          : null,
      };
    }),
  );

  return programsWithCurriculum
    .filter((program) => program.curriculum)
    .toSorted((a, b) =>
      (a.course.discipline.title ?? a.course.handle).localeCompare(
        b.course.discipline.title ?? b.course.handle,
      ),
    );
}

export async function getGearTypesForNwdCCurriculum(curriculumId: string) {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email)) {
    throw new Error("Geen toegang tot deze functie");
  }

  return Curriculum.GearType.list({
    filter: { curriculumId },
  });
}

export async function listLocationsForNwdCRegistration() {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email)) {
    throw new Error("Geen toegang tot deze functie");
  }

  const locations = await Location.list({
    filters: { status: ["active"] },
  });

  return locations
    .map((location) => ({
      id: location.id,
      handle: location.handle,
      name: location.name,
    }))
    .toSorted((a, b) => (a.name ?? a.handle).localeCompare(b.name ?? b.handle));
}

export async function getExistingNwdCCertificateKeys(personId: string) {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email)) {
    throw new Error("Geen toegang tot deze functie");
  }

  const certificates = await Certificate.list({
    filter: { personId },
  });

  return certificates.items
    .filter(
      (certificate) =>
        certificate.program.degree.handle === Certificate.NWD_C_DEGREE_HANDLE &&
        Boolean(certificate.issuedAt),
    )
    .map((certificate) => ({
      curriculumId: certificate.curriculum.id,
      gearTypeId: certificate.gearType.id,
    }));
}
