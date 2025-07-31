import type { RedisConfiguration, SupabaseConfiguration } from "@nawadi/core";
import {
  Certificate,
  Cohort,
  Course,
  Curriculum,
  KSS,
  Location,
  Logbook,
  Marketing,
  Platform,
  Pvb,
  Student,
  User,
  withRedisClient,
  withSupabaseClient,
  withTransaction,
} from "@nawadi/core";
import slugify from "@sindresorhus/slugify";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";
import packageInfo from "~/../package.json";
import dayjs from "~/lib/dayjs";
import { isSecretariaat } from "~/utils/auth/is-secretariaat";
import { isSystemAdmin } from "~/utils/auth/is-system-admin";
import { invariant } from "~/utils/invariant";
import posthog from "./posthog";

export type ActorType =
  | "student"
  | "instructor"
  | "location_admin"
  | "pvb_beoordelaar"
  | "secretariaat";

export type LocationActorType = Exclude<
  ActorType,
  "secretariaat" | "pvb_beoordelaar"
>;

invariant(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "Missing NEXT_PUBLIC_SUPABASE_URL",
);
invariant(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  "Missing SUPABASE_SERVICE_ROLE_KEY",
);
invariant(process.env.REDIS_URL, "Missing REDIS_URL");
invariant(process.env.PGURI, "Missing PGURI");

export const supabaseConfig: SupabaseConfiguration = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};
const redisConfig: RedisConfiguration = {
  url: process.env.REDIS_URL,
};

type MediaType = File | Buffer;

async function constructMediaBuffer(media: MediaType) {
  return Buffer.from(
    new Uint8Array(media instanceof File ? await media.arrayBuffer() : media),
  );
}

type MediaRemoveType = () => ReturnType<typeof Platform.Media.remove>;
type MediaCreateOrReplaceResult<Media, OldId> = Media extends undefined
  ? { id?: never; remove?: never }
  : Media extends null
    ? OldId extends null
      ? { id: null; remove?: never }
      : { id: null; remove: MediaRemoveType }
    : OldId extends null
      ? { id: string; remove?: never }
      : { id: string; remove: MediaRemoveType };

/**
 * Creates a new media or replaces an existing one, if media is undefined, the existing media will not be removed / no action is performed.
 * @param media - The media to create or replace.
 * @param oldMediaId - The ID of the existing media to replace.
 * @returns The ID of the created or replaced media and a function to remove the old media.
 */
async function createOrReplaceMedia<
  Media extends MediaType | null | undefined,
  OldId extends string | null = null,
>(
  media: Media,
  oldMediaId?: OldId,
  creationOptions: Omit<Parameters<typeof Platform.Media.create>[0], "file"> = {
    isPublic: false,
  },
): Promise<MediaCreateOrReplaceResult<Media, OldId>> {
  if (typeof media === "undefined") {
    return { id: undefined, remove: undefined } as MediaCreateOrReplaceResult<
      Media,
      OldId
    >;
  }

  let id: string | null = null;
  let remove: MediaRemoveType | undefined;

  if (oldMediaId) {
    remove = () => Platform.Media.remove(oldMediaId);
  }

  if (media) {
    const buffer = await constructMediaBuffer(media);
    const { id: newId } = await Platform.Media.create({
      file: buffer,
      ...creationOptions,
    });
    id = newId;
  }

  return { id, remove } as MediaCreateOrReplaceResult<Media, OldId>;
}

export async function getPrimaryPerson<T extends boolean = true>(
  user: Awaited<ReturnType<typeof getUserOrThrow>>,
  force = true as T,
): Promise<
  T extends true
    ? Awaited<ReturnType<typeof getUserOrThrow>>["persons"][number]
    : Awaited<ReturnType<typeof getUserOrThrow>>["persons"][number] | null
> {
  if (user.persons.length === 0) {
    throw new Error("Expected at least one person for user");
  }

  const primaryPerson =
    user.persons.find((person) => person.isPrimary) ??
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    user.persons[0]!;

  if (!primaryPerson.isPrimary && !force) {
    return null as T extends true
      ? Awaited<ReturnType<typeof getUserOrThrow>>["persons"][number]
      : null;
  }

  if (!primaryPerson.isPrimary) {
    await User.Person.setPrimary({ personId: primaryPerson.id });
  }

  return primaryPerson;
}

// Should be used in the future to check if a user is secretariaat, but for now the middleware is hardcoded
// export async function isUserActiveActorType(
//   userId: string,
//   actorType: ActorType,
// ) {
//   return makeRequest(async () => {
//     const activeTypes = await User.Actor.listActiveTypesForUser({
//       userId,
//     });

//     return activeTypes.includes(actorType);
//   });
// }

async function isActiveActorTypeInLocation({
  actorType,
  locationId,
  personId,
}: {
  personId: string;
  locationId: string;
  actorType: LocationActorType[];
}) {
  const availableLocations = await User.Person.listLocationsByRole({
    personId: personId,
    roles: actorType,
  });

  const isMatch = availableLocations.some((l) => l.locationId === locationId);

  if (!isMatch) {
    throw new Error("Unauthorized");
  }

  return true as const;
}

async function makeRequest<T>(cb: () => Promise<T>) {
  try {
    return await withSupabaseClient(supabaseConfig, async () => {
      return await cb();
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const getUserOrThrow = cache(async () => {
  const cookieStore = await cookies();

  invariant(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "Missing NEXT_PUBLIC_SUPABASE_URL",
  );
  invariant(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  const userResponse = await supabase.auth.getUser();

  if (userResponse.error != null) {
    redirect("/login");
  }

  const { user: authUser } = userResponse.data;

  return makeRequest(async () => {
    // Check for impersonation
    const impersonatedUserId = cookieStore.get("impersonated_user_id")?.value;
    const isImpersonating = !!impersonatedUserId;

    let targetUserId = authUser.id;
    let originalUser = null;

    if (isImpersonating) {
      // Verify the current user is a system admin
      const currentUserData = await User.fromId(authUser.id);

      if (!isSystemAdmin(currentUserData?.email)) {
        // Remove invalid impersonation cookie
        cookieStore.delete("impersonated_user_id");
        throw new Error("Unauthorized impersonation attempt");
      }

      // Store original user info for audit/context
      originalUser = currentUserData;
      targetUserId = impersonatedUserId;
    }

    const userData = await User.fromId(targetUserId);
    // We can't run this in parallel, because fromId will create the user if it doesn't exist
    const persons = await User.Person.list({
      filter: { userId: targetUserId },
    });

    if (!userData) {
      throw new Error("User not found");
    }

    return {
      ...userData,
      persons: (() => {
        const primaryPerson = persons.items.find((person) => person.isPrimary);
        const nonPrimaryPersons = persons.items.filter(
          (person) => !person.isPrimary,
        );
        return primaryPerson
          ? [primaryPerson, ...nonPrimaryPersons]
          : nonPrimaryPersons;
      })(),
      // Add impersonation metadata
      _impersonation: isImpersonating
        ? {
            isImpersonating: true,
            originalUserId: authUser.id,
            originalUser,
            impersonatedUserId: targetUserId,
          }
        : undefined,
    };
  });
});

export const startImpersonation = async (targetUserId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();

    // Verify system admin permissions
    const isCurrentUserSystemAdmin = isSystemAdmin(authUser.email);
    if (!isCurrentUserSystemAdmin) {
      throw new Error("Unauthorized");
    }

    // Verify target user exists
    const targetUser = await User.fromId(targetUserId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Set impersonation cookie
    const cookieStore = await cookies();
    cookieStore.set("impersonated_user_id", targetUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    posthog.capture({
      distinctId: authUser.authUserId,
      event: "start_impersonation",
      properties: {
        targetUserId,
        adminEmail: authUser.email,
      },
    });

    await posthog.shutdown();

    return { success: true };
  });
};

export const stopImpersonation = async () => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    if (!user._impersonation?.isImpersonating) {
      throw new Error("Not currently impersonating");
    }

    // Remove impersonation cookie
    const cookieStore = await cookies();
    cookieStore.delete("impersonated_user_id");

    posthog.capture({
      distinctId: user._impersonation.originalUserId,
      event: "stop_impersonation",
      properties: {
        impersonatedUserId: user._impersonation.impersonatedUserId,
      },
    });

    await posthog.shutdown();

    return { success: true };
  });
};

export const findCertificate = async ({
  handle,
  issuedAt,
}: {
  handle: string;
  issuedAt: string;
}) => {
  return makeRequest(async () => {
    const certificate = await Certificate.find({
      handle,
      issuedAt,
    });

    if (!certificate) {
      notFound();
    }

    return certificate;
  });
};

export const listCertificates = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: person.id,
    });

    const certificates = await Certificate.list({
      filter: { locationId },
    });

    return certificates.items;
  });
});

export const listCertificatesWithPagination = cache(
  async (
    locationId: string,
    { q, limit, offset }: { q: string; limit: number; offset: number },
  ) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: person.id,
      });

      return await Certificate.list({
        filter: { locationId, q },
        limit,
        offset,
      });
    });
  },
);

async function validatePersonAccessCheck({
  locationId,
  requestingUser,
  requestedPersonId,
}: {
  requestingUser: Awaited<ReturnType<typeof getUserOrThrow>>;
  locationId: string;
  requestedPersonId: string;
}) {
  const requestingUserPrimaryPerson = await getPrimaryPerson(requestingUser);

  const isLocationAdminRequest = isActiveActorTypeInLocation({
    actorType: ["location_admin"],
    locationId,
    personId: requestingUserPrimaryPerson.id,
  }).catch(() => false);

  const isInstructorInSameActiveCohortRequest = isActiveActorTypeInLocation({
    actorType: ["instructor"],
    locationId,
    personId: requestingUserPrimaryPerson.id,
  })
    .catch(() => false)
    .then(async (isInstructor) => {
      if (!isInstructor) {
        return false;
      }

      return await Cohort.Allocation.personsBelongTogetherInActiveCohort({
        personId: [requestingUserPrimaryPerson.id, requestedPersonId],
      });
    })
    .catch(() => false);

  const isRequestedPersonAnActivePersonForLocationRequest =
    isActiveActorTypeInLocation({
      actorType: ["instructor", "student", "location_admin"],
      locationId,
      personId: requestedPersonId,
    });

  const [
    isLocationAdmin,
    isInstructorInSameActiveCohort,
    isRequestedPersonAnActiveStudentOrInstructorForLocation,
  ] = await Promise.all([
    isLocationAdminRequest,
    isInstructorInSameActiveCohortRequest,
    isRequestedPersonAnActivePersonForLocationRequest,
  ]);

  if (
    !isRequestedPersonAnActiveStudentOrInstructorForLocation ||
    !(isLocationAdmin || isInstructorInSameActiveCohort)
  ) {
    throw new Error("Unauthorized");
  }
}

export const listCertificatesForPerson = cache(
  async (personId: string, locationId?: string) => {
    return makeRequest(async () => {
      const requestingUser = await getUserOrThrow();

      const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

      if (!isSelf) {
        if (locationId) {
          await validatePersonAccessCheck({
            locationId,
            requestedPersonId: personId,
            requestingUser,
          });
        } else if (
          !isSystemAdmin(requestingUser.email) &&
          !isSecretariaat(requestingUser.email)
        ) {
          throw new Error("Unauthorized");
        }
      }

      const certificates = await Certificate.list({
        filter: { personId },
        respectVisibility: true,
      });

      return certificates.items;
    });
  },
);

export const listExternalCertificatesForPerson = cache(
  async (personId: string, locationId?: string) => {
    return makeRequest(async () => {
      const requestingUser = await getUserOrThrow();

      const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

      if (!isSelf) {
        if (!locationId) {
          throw new Error("Unauthorized");
        }

        await validatePersonAccessCheck({
          locationId,
          requestedPersonId: personId,
          requestingUser,
        });
      }

      const certificates = await Certificate.External.listForPerson({
        personId,
      });

      return certificates;
    });
  },
);

export const createExternalCertificate = async ({
  personId,
  media,
  fields,
}: {
  personId: string;
  media: MediaType | null;
  fields: {
    title: string;
    awardedAt: string | null;
    issuingAuthority: string | null;
    issuingLocation: string | null;
    identifier: string | null;
    metadata: Record<string, string> | null;
    additionalComments: string | null;
  };
}) => {
  return makeRequest(async () => {
    const requestingUser = await getUserOrThrow();

    const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

    if (!isSelf) {
      throw new Error("Unauthorized");
    }

    const { id: mediaId } = await createOrReplaceMedia(media);

    return await Certificate.External.create({
      personId,
      mediaId,
      ...fields,
    });
  });
};

export const updateExternalCertificate = async ({
  id,
  personId,
  media,
  fields,
}: {
  id: string;
  personId: string;
  media?: MediaType | null;
  fields?: {
    title?: string;
    awardedAt?: string | null;
    issuingAuthority?: string | null;
    issuingLocation?: string | null;
    identifier?: string | null;
    metadata?: Record<string, string> | null;
    additionalComments?: string | null;
  };
}) => {
  return makeRequest(async () => {
    const requestingUser = await getUserOrThrow();

    const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

    if (!isSelf) {
      throw new Error("Unauthorized");
    }

    const oldCertificate = await Certificate.External.byId({ id });

    if (!oldCertificate) {
      throw new Error("Certificate not found");
    }

    if (oldCertificate.personId !== personId) {
      throw new Error("Unauthorized");
    }

    const { id: mediaId, remove: removeMedia } = await createOrReplaceMedia(
      media,
      oldCertificate.mediaId,
    );

    const certificate = await Certificate.External.update({
      id,
      mediaId,
      ...fields,
    });

    await removeMedia?.();

    return certificate;
  });
};

export const removeExternalCertificate = async ({
  personId,
  id,
}: {
  personId: string;
  id: string;
}) => {
  return makeRequest(async () => {
    const requestingUser = await getUserOrThrow();

    const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

    if (!isSelf) {
      throw new Error("Unauthorized");
    }

    const certificate = await Certificate.External.byId({ id });

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    if (certificate.personId !== personId) {
      throw new Error("Unauthorized");
    }

    return await Certificate.External.remove(id);
  });
};

export const listCertificatesByNumber = cache(
  async (
    numbers: string[],
    sort: "createdAt" | "student" | "instructor" = "createdAt",
  ) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow().catch(() => null);

      if (!user && numbers.length > 1) {
        // @TODO this is a temporary fix to allow for consumers to download their certificate without being logged in
        // we should find a better way to handle this
        // @TODO: Also fix that the secretariaat can download certificates
        redirect("/login");
      }

      const listAvailableLocationsForLoggedInUser = async (
        loggedInUser: typeof user,
      ) => {
        if (!loggedInUser) {
          return [];
        }

        const person = await getPrimaryPerson(loggedInUser);

        // TODO: this authorization check should be more specific
        const availableLocations = await User.Person.listLocationsByRole({
          personId: person.id,
          roles: ["location_admin", "instructor"],
        });

        return availableLocations.map((location) => location.locationId);
      };

      const locationFilter = user
        ? await listAvailableLocationsForLoggedInUser(user)
        : [];

      const certificates = await Certificate.list({
        filter: {
          number: numbers,
          ...(locationFilter.length > 0 && { locationId: locationFilter }),
        },
        sort:
          sort === "createdAt"
            ? [sort]
            : sort === "student"
              ? ["student", "createdAt"]
              : ["instructor", "student", "createdAt"],
      });

      return certificates.items;
    });
  },
);

export const retrieveCertificateById = async (id: string) => {
  "use cache";
  cacheLife("minutes");

  return makeRequest(async () => {
    const certificate = await Certificate.byId(id);

    if (!certificate) {
      notFound();
    }

    return certificate;
  });
};

export const listDisciplines = async () => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const disciplines = await Course.Discipline.list();

    return disciplines;
  });
};

export const listDisciplinesForLocation = async (locationId: string) => {
  "use cache";
  cacheLife("days");
  cacheTag(`${locationId}-resource-link`);

  return makeRequest(async () => {
    const disciplines = await Course.Discipline.list({
      filter: { locationId },
    });

    return disciplines;
  });
};

export const listDegrees = async () => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const degrees = await Course.Degree.list();

    return degrees;
  });
};

export const listModules = async () => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const modules = await Course.Module.list();

    return modules;
  });
};

export const listCompetencies = async () => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const competencies = await Course.Competency.list();

    return competencies;
  });
};

export const listGearTypes = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("gear-types");

  return makeRequest(async () => {
    const gearTypes = await Curriculum.GearType.list();

    return gearTypes;
  });
};

export const listGearTypesForLocation = async (locationId: string) => {
  "use cache";
  cacheLife("days");
  cacheTag("gear-types");
  cacheTag(`${locationId}-resource-link`);

  return makeRequest(async () => {
    const gearTypes = await Curriculum.GearType.list({
      filter: {
        locationId: locationId,
      },
    });

    return gearTypes;
  });
};

export const listCategories = async () => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const categories = await Course.Category.list();

    return categories;
  });
};

export const listParentCategories = async () => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const categories = await Course.Category.listParentCategories();

    return categories;
  });
};

export const listCountries = async () => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const countries = await Platform.Country.list();

    return countries;
  });
};

export const retrieveDisciplineByHandle = async (handle: string) => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const disciplines = await Course.Discipline.fromHandle(handle);

    return disciplines;
  });
};

export const listCourses = async (
  typeOfCourses?: "consument" | "instructeur",
  locationId?: string,
) => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const courses = await Course.list({
      filter: {
        type: typeOfCourses,
        ...(locationId && { locationId }),
      },
    });

    return courses;
  });
};

export const retrieveCourseByHandle = async (handle: string) => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const courses = await Course.list();

    return courses.find((course) => course.handle === handle);
  });
};

export const listPrograms = async () => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const programs = await Course.Program.list();

    return programs;
  });
};

export const listProgramsForLocation = async (locationId: string) => {
  "use cache";
  cacheLife("days");
  cacheTag(`${locationId}-resource-link`);

  return makeRequest(async () => {
    const programs = await Course.Program.list({
      filter: { locationId },
    });

    return programs;
  });
};

export const listProgramsForCourse = async (courseId: string) => {
  "use cache";
  cacheLife("days");

  return makeRequest(async () => {
    const programs = await Course.Program.list({ filter: { courseId } });

    return programs;
  });
};

export const listCurriculaByDiscipline = async (disciplineId: string) => {
  "use cache";
  cacheLife("days");
  cacheTag("curricula");

  return makeRequest(async () => {
    const curricula = await Curriculum.list({
      filter: { onlyCurrentActive: true, disciplineId },
    });

    return curricula;
  });
};

export const listCurriculaByIds = async (curriculumIds: string[]) => {
  "use cache";
  cacheLife("days");
  cacheTag("curricula");

  return makeRequest(async () => {
    const curricula = await Curriculum.list({
      filter: { id: curriculumIds },
    });

    return curricula;
  });
};

export const listCurriculaByProgram = async (
  programId: string,
  onlyCurrentActive = true,
) => {
  "use cache";
  cacheLife("days");
  cacheTag("curricula");

  return makeRequest(async () => {
    const curricula = await Curriculum.list({
      filter: { onlyCurrentActive, programId },
    });

    return curricula;
  });
};

export const retrieveCurriculumById = async (id: string) => {
  "use cache";
  cacheLife("days");
  cacheTag("curricula");

  return makeRequest(async () => {
    return await Curriculum.getById({ id });
  });
};

export const countStartedStudentsForCurriculum = cache(
  async (curriculumId: string) => {
    return makeRequest(async () => {
      const count = await Curriculum.countStartedStudents({
        curriculumId,
      });

      return count;
    });
  },
);

export const updateCurriculumCompetencyRequirement = async (
  competencyId: string,
  requirement: string,
) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
      throw new Error("Unauthorized");
    }

    return Curriculum.Competency.updateRequirement({
      competencyId,
      requirement,
    });
  });
};

export const updateCurriculumGearTypes = async (
  curriculumId: string,
  gearTypes: string[],
) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
      throw new Error("Unauthorized");
    }

    return Curriculum.updateGearTypes({ curriculumId, gearTypes });
  });
};

export const copyCurriculum = async ({
  curriculumId,
  revision,
}: {
  curriculumId: string;
  revision?: string;
}) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
      throw new Error("Unauthorized");
    }

    return Curriculum.copy({
      curriculumId,
      revision: revision ?? `Copy of ${new Date().toISOString()}`,
    });
  });
};

export const listGearTypesByCurriculum = async (curriculumId: string) => {
  "use cache";
  cacheLife("days");
  cacheTag("curricula");
  cacheTag("gear-types");

  return makeRequest(async () => {
    const gearTypes = await Curriculum.GearType.list({
      filter: {
        curriculumId: curriculumId,
      },
    });

    return gearTypes;
  });
};

export const listGearTypesByCurriculumForLocation = async (
  locationId: string,
  curriculumId: string,
) => {
  "use cache";
  cacheLife("days");
  cacheTag("curricula");
  cacheTag("gear-types");
  cacheTag(`${locationId}-resource-link`);

  return makeRequest(async () => {
    const gearTypes = await Curriculum.GearType.list({
      filter: {
        curriculumId: curriculumId,
        locationId: locationId,
      },
    });

    return gearTypes;
  });
};

export const retrieveLocationByHandle = async (handle: string) => {
  "use cache";
  cacheLife("days");
  cacheTag("locations");

  return makeRequest(async () => {
    return await Location.fromHandle(handle);
  });
};

export const listResourcesForLocation = async (locationId: string) => {
  "use cache";
  cacheLife("days");
  cacheTag(`${locationId}-resource-link`);

  return makeRequest(async () => {
    return await Location.listResources(locationId);
  });
};

export const listPersonsForLocation = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    const isLocationAdmin = await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: person.id,
    }).catch(() => false);

    if (!isLocationAdmin) {
      return [];
    }

    const persons = await User.Person.list({ filter: { locationId } });

    return persons.items;
  });
});

export const listPersonsWithPagination = cache(
  async ({
    limit,
    offset,
    filter,
  }: {
    limit?: number;
    offset?: number;
    filter?: {
      actorType?: ActorType | ActorType[] | null;
      q?: string;
    };
  } = {}) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();

      const isCurrentUserSystemAdmin = isSystemAdmin(user.email);
      const isCurrentUserSecretariaat = isSecretariaat(user.email);

      if (!isCurrentUserSystemAdmin && !isCurrentUserSecretariaat) {
        throw new Error("Unauthorized");
      }

      const persons = await User.Person.list({
        filter: {
          q: filter?.q ?? undefined,
          actorType: filter?.actorType ?? undefined,
        },
        limit,
        offset,
      });

      return persons;
    });
  },
);

export const listPersonsForLocationWithPagination = cache(
  async (
    locationId: string,
    {
      limit,
      offset,
      filter,
    }: {
      limit?: number;
      offset?: number;
      filter?: {
        actorType?: LocationActorType | LocationActorType[] | null;
        q?: string;
      };
    } = {},
  ) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      const isLocationAdmin = await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: person.id,
      }).catch(() => false);

      if (!isLocationAdmin) {
        return {
          items: [],
          count: 0,
          limit,
          offset,
        } as Awaited<ReturnType<typeof User.Person.list>>;
      }

      const persons = await User.Person.list({
        filter: {
          locationId,
          q: filter?.q ?? undefined,
          actorType: filter?.actorType ?? undefined,
        },
        limit,
        offset,
      });

      return persons;
    });
  },
);

export const listBeoordelaarsForLocation = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    const isLocationAdmin = await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: person.id,
    }).catch(() => false);

    if (!isLocationAdmin) {
      return [];
    }

    const persons = await KSS.Kwalificaties.listBeoordelaars({
      filter: {
        locationId,
      },
    });

    return persons;
  });
});

export const getPersonById = cache(async (personId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
      throw new Error("Unauthorized");
    }

    const person = await User.Person.byIdOrHandle({ id: personId });
    return person;
  });
});

export const mergePersons = async (
  primaryPersonId: string,
  secondaryPersonId: string,
) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    // const primaryPerson = await getPrimaryPerson(user);

    if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
      throw new Error("Unauthorized");
    }

    await User.Person.mergePersons({
      personId: secondaryPersonId,
      targetPersonId: primaryPersonId,
      // createdBy:
      //   primaryPerson.actors.find((actor) => actor.type === "secretariaat")
      //     ?.id ?? undefined,
    });
  });
};

export const getPersonByIdForLocation = cache(
  async (personId: string, locationId: string) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();

      await validatePersonAccessCheck({
        locationId,
        requestedPersonId: personId,
        requestingUser: user,
      });

      const person = await User.Person.byIdOrHandle({ id: personId });
      return person;
    });
  },
);

export const getPersonByHandle = cache(async (handle: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    const person = await User.Person.byIdOrHandle({ handle });

    if (person.userId !== user.authUserId) {
      throw new Error("Unauthorized");
    }

    return person;
  });
});

export const listPersonsForUser = cache(async () => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    const persons = await User.Person.list({
      filter: { userId: user.authUserId },
    });

    return persons.items;
  });
});

export const listPersonsForLocationByRole = cache(
  async (locationId: string, role: LocationActorType) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      const isLocationAdmin = await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: person.id,
      }).catch(() => false);

      if (!isLocationAdmin) {
        return [];
      }

      const persons = await Location.Person.list({
        locationId,
        filter: { type: role },
      });

      return persons;
    });
  },
);

export const listActiveLocationsForPerson = cache(
  async (personId?: string, roles?: LocationActorType[]) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      if (
        personId &&
        person.id !== personId &&
        !isSystemAdmin(user.email) &&
        !isSecretariaat(user.email)
      ) {
        throw new Error("Unauthorized");
      }

      const [locations, allLocations] = await Promise.all([
        User.Person.listLocationsByRole({
          personId: personId ?? person.id,
          roles,
        }),
        Location.list(),
      ]);

      return locations.map((l) => {
        const location = allLocations.find((loc) => loc.id === l.locationId);
        if (!location) {
          throw new Error(`Location not found: ${l.locationId}`);
        }

        return {
          ...location,
          roles: l.roles,
        };
      });
    });
  },
);

export const listAllLocationsForPerson = cache(async (personId?: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    if (
      personId &&
      person.id !== personId &&
      !isSystemAdmin(user.email) &&
      !isSecretariaat(user.email)
    ) {
      throw new Error("Unauthorized");
    }

    const [locations, allLocations] = await Promise.all([
      User.Person.listAllLocations({
        personId: personId ?? person.id,
      }),
      Location.list(),
    ]);

    return locations.map((l) => {
      const location = allLocations.find((loc) => loc.id === l.locationId);
      if (!location) {
        throw new Error(`Location not found: ${l.locationId}`);
      }

      return {
        ...location,
        linkStatus: l.linkStatus,
        roles: l.roles,
      };
    });
  });
});

export const listLocationsWherePrimaryPersonHasManagementRole = cache(
  async () => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      const locations = await User.Person.listLocationsByRole({
        personId: person.id,
        roles: ["instructor", "location_admin"],
      });

      return await Location.list().then((locs) =>
        locs.filter((l) => locations.some((loc) => loc.locationId === l.id)),
      );
    });
  },
);

export const listAllLocations = cache(async () => {
  return makeRequest(async () => {
    return await Location.list();
  });
});

export const createStudentForLocation = async (
  locationId: string,
  personInput: {
    email: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string;
    dateOfBirth: Date;
    birthCity: string;
    birthCountry: string;
  },
) => {
  return createPersonForLocation(locationId, ["student"], personInput);
};

export const createInstructorForLocation = async (
  locationId: string,
  personInput: {
    email: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string;
    dateOfBirth: Date;
    birthCity: string;
    birthCountry: string;
  },
) => {
  return createPersonForLocation(locationId, ["instructor"], personInput);
};

export const createPersonForLocation = async (
  locationId: string,
  roles: LocationActorType[],
  personInput: {
    email: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string;
    dateOfBirth: Date;
    birthCity: string;
    birthCountry: string;
  },
) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: primaryPerson.id,
    });

    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let user;

    if (personInput.email) {
      user = await User.getOrCreateFromEmail({
        email: personInput.email,
        displayName: personInput.firstName,
      });
    }

    const person = await User.Person.getOrCreate({
      userId: user?.id,
      firstName: personInput.firstName,
      lastName: personInput.lastName,
      lastNamePrefix: personInput.lastNamePrefix,
      dateOfBirth: personInput.dateOfBirth.toISOString(),
      birthCity: personInput.birthCity,
      birthCountry: personInput.birthCountry,
    });

    await User.Person.createLocationLink({
      personId: person.id,
      locationId: locationId,
    });

    if (
      roles.length < 1 ||
      (!roles.includes("student") &&
        !roles.includes("instructor") &&
        !roles.includes("location_admin"))
    ) {
      throw new Error("Invalid roles");
    }

    if (roles.includes("student")) {
      await User.Actor.upsert({
        locationId: locationId,
        type: "student",
        personId: person.id,
      });

      posthog.capture({
        distinctId: authUser.authUserId,
        event: "create_student_for_location",
        properties: {
          $set: { email: authUser.email, displayName: authUser.displayName },
        },
      });
    }

    if (roles.includes("instructor")) {
      await User.Actor.upsert({
        locationId: locationId,
        type: "instructor",
        personId: person.id,
      });

      posthog.capture({
        distinctId: authUser.authUserId,
        event: "create_instructor_for_location",
        properties: {
          $set: { email: authUser.email, displayName: authUser.displayName },
        },
      });
    }

    if (roles.includes("location_admin")) {
      await User.Actor.upsert({
        locationId: locationId,
        type: "location_admin",
        personId: person.id,
      });

      posthog.capture({
        distinctId: authUser.authUserId,
        event: "create_location_admin_for_location",
        properties: {
          $set: { email: authUser.email, displayName: authUser.displayName },
        },
      });
    }

    await posthog.shutdown();

    return person;
  });
};

export const createCompletedCertificate = async (
  locationId: string,
  personId: string,
  {
    curriculumId,
    gearTypeId,
    competencies,
  }: {
    curriculumId: string;
    gearTypeId: string;
    competencies: string[];
  },
) => {
  return makeRequest(async () => {
    return withTransaction(async () => {
      const authUser = await getUserOrThrow();
      const primaryPerson = await getPrimaryPerson(authUser);

      await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: primaryPerson.id,
      });

      // Start student curriculum
      const { id: studentCurriculumId } = await Student.Curriculum.start({
        curriculumId,
        personId,
        gearTypeId,
      });

      // Start certificate
      const { id: certificateId } = await Student.Certificate.startCertificate({
        locationId,
        studentCurriculumId,
      });

      // Add completed competencies
      await Student.Certificate.completeCompetency({
        certificateId,
        studentCurriculumId,
        competencyId: competencies.flat(),
      });

      // Complete certificate
      await Student.Certificate.completeCertificate({
        certificateId,
        visibleFrom: new Date().toISOString(),
      });

      posthog.capture({
        distinctId: authUser.authUserId,
        event: "create_completed_certificate",
        properties: {
          $set: { email: authUser.email, displayName: authUser.displayName },
        },
      });

      await posthog.shutdown();

      return { id: certificateId };
    });
  });
};

export const issueCertificatesInCohort = async ({
  cohortId,
  studentAllocationIds,
  visibleFrom,
}: {
  studentAllocationIds: string[];
  cohortId: string;
  visibleFrom?: string;
}) => {
  return makeRequest(async () => {
    return withTransaction(async () => {
      const [authUser, cohort] = await Promise.all([
        getUserOrThrow(),
        Cohort.byIdOrHandle({ id: cohortId }),
      ]);

      if (!cohort) {
        throw new Error("Cohort not found");
      }

      const primaryPerson = await getPrimaryPerson(authUser);

      const listCohortStatusPromise = Cohort.Certificate.listStatus({
        cohortId,
      });

      const [isLocationAdmin, privileges, allocationData, curricula] =
        await Promise.all([
          isActiveActorTypeInLocation({
            actorType: ["location_admin"],
            locationId: cohort.locationId,
            personId: primaryPerson.id,
          }).catch(() => false),
          Cohort.Allocation.listPrivilegesForPerson({
            cohortId,
            personId: primaryPerson.id,
          }),
          listCohortStatusPromise,
          listCohortStatusPromise.then((status) =>
            Curriculum.list({
              filter: {
                id: Array.from(
                  new Set(
                    status
                      .map((s) => s.studentCurriculum?.curriculumId)
                      .filter(Boolean) as string[],
                  ),
                ),
              },
            }),
          ),
        ]);

      if (
        !isLocationAdmin &&
        !privileges.includes("manage_cohort_certificate")
      ) {
        throw new Error("Unauthorized");
      }

      const result = await Promise.all(
        studentAllocationIds.map(async (allocationId) => {
          const allocation = allocationData.find((d) => d.id === allocationId);
          if (!allocation?.studentCurriculum || allocation.certificate) {
            throw new Error(`Invalid allocation: ${allocationId}`);
          }

          const completedModules =
            allocation.studentCurriculum.moduleStatus.filter(
              ({ totalCompetencies, completedCompetencies }) =>
                completedCompetencies >= totalCompetencies,
            );

          if (completedModules.length < 1) {
            throw new Error(
              `No completed modules for allocation: ${allocationId}`,
            );
          }

          const curriculum = curricula.find(
            (c) => c.id === allocation.studentCurriculum?.curriculumId,
          );

          if (!curriculum) {
            throw new Error("Curriculum not found");
          }

          const { id: certificateId } =
            await Student.Certificate.startCertificate({
              locationId: cohort.locationId,
              studentCurriculumId: allocation.studentCurriculum.id,
            });

          const competencyIds = curriculum.modules
            .filter(({ id }) =>
              completedModules.some(({ module }) => module.id === id),
            )
            .flatMap(({ competencies }) => competencies.map(({ id }) => id));

          await Student.Certificate.completeCompetency({
            certificateId,
            studentCurriculumId: allocation.studentCurriculum.id,
            competencyId: competencyIds,
          });

          await Student.Certificate.completeCertificate({
            certificateId,
            visibleFrom: visibleFrom ?? new Date().toISOString(),
          });

          await Certificate.assignToCohortAllocation({
            certificateId,
            cohortAllocationId: allocationId,
          });

          return { id: certificateId };
        }),
      );

      posthog.capture({
        distinctId: authUser.authUserId,
        event: "create_completed_certificate_bulk",
        properties: {
          $set: { email: authUser.email, displayName: authUser.displayName },
          cohortId,
          certificateCount: result.length,
        },
      });

      await posthog.shutdown();

      return result;
    });
  });
};

export const removeStudentCurricula = async ({
  studentCurriculaIds,
}: {
  studentCurriculaIds: string | [string, ...string[]];
}) => {
  return makeRequest(async () => {
    return withTransaction(async () => {
      const authUser = await getUserOrThrow();

      if (!isSystemAdmin(authUser.email) && !isSecretariaat(authUser.email)) {
        throw new Error("Unauthorized");
      }

      await Student.Curriculum.remove({
        id: studentCurriculaIds,
      });

      return;
    });
  });
};

export const withdrawCertificates = async ({
  certificateIds,
}: {
  certificateIds: string[];
}) => {
  return makeRequest(async () => {
    return withTransaction(async () => {
      const authUser = await getUserOrThrow();

      if (!isSystemAdmin(authUser.email) && !isSecretariaat(authUser.email)) {
        throw new Error("Unauthorized");
      }

      await Promise.all(
        certificateIds.map((certificateId) =>
          Certificate.withdraw({ certificateId, ignoreTimeLimit: true }),
        ),
      );

      return;
    });
  });
};

export const withdrawCertificatesInCohort = async ({
  certificateIds,
  cohortId,
}: {
  certificateIds: string[];
  cohortId: string;
}) => {
  return makeRequest(async () => {
    return withTransaction(async () => {
      const [authUser, cohort] = await Promise.all([
        getUserOrThrow(),
        Cohort.byIdOrHandle({ id: cohortId }),
      ]);

      if (!cohort) {
        throw new Error("Cohort not found");
      }

      const primaryPerson = await getPrimaryPerson(authUser);

      const [isLocationAdmin, privileges] = await Promise.all([
        isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId: cohort.locationId,
          personId: primaryPerson.id,
        }).catch(() => false),
        Cohort.Allocation.listPrivilegesForPerson({
          cohortId,
          personId: primaryPerson.id,
        }),
      ]);

      if (
        !isLocationAdmin &&
        !privileges.includes("manage_cohort_certificate")
      ) {
        throw new Error("Unauthorized");
      }

      // TODO: Check if the certificates are in the cohort

      await Promise.all(
        certificateIds.map((certificateId) =>
          Certificate.withdraw({ certificateId }),
        ),
      );

      return;
    });
  });
};

export const listActiveCohortsForPerson = cache(
  async ({
    personId,
  }: {
    personId?: string;
  } = {}) => {
    return makeRequest(async () => {
      const authUser = await getUserOrThrow();
      const primaryPerson = await getPrimaryPerson(authUser);

      if (personId && personId !== primaryPerson.id) {
        throw new Error("Unauthorized");
      }

      const cohorts =
        await Cohort.Allocation.listPersonActiveCohortsGroupedByLocation({
          personId: personId ?? primaryPerson.id,
          allocationType: ["instructor", "location_admin"],
        });

      return cohorts;
    });
  },
);

export const listCohortsForLocation = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const isLocationAdmin = await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: primaryPerson.id,
    }).catch(() => false);

    const cohorts = await Cohort.listByLocationId({
      id: locationId,
      personId: isLocationAdmin ? undefined : primaryPerson.id,
    });

    return cohorts;
  });
});

export const retrieveCohortByHandle = cache(
  async (handle: string, locationId: string) => {
    return makeRequest(async () => {
      const authUser = await getUserOrThrow();
      const primaryPerson = await getPrimaryPerson(authUser);

      const cohort = await Cohort.byIdOrHandle({ handle, locationId });

      if (!cohort) {
        return null;
      }

      const [isLocationAdmin, isInstructorInCohort] = await Promise.all([
        isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId: cohort?.locationId,
          personId: primaryPerson.id,
        }).catch(() => false),
        Cohort.Allocation.listByPersonId({
          cohortId: cohort.id,
          personId: primaryPerson.id,
          actorType: "instructor",
        }).then((actors) => actors.length > 0),
      ]);

      const canAccessCohort =
        isLocationAdmin ||
        (isInstructorInCohort &&
          dayjs().isAfter(dayjs(cohort.accessStartTime)) &&
          dayjs().isBefore(dayjs(cohort.accessEndTime)));

      if (!canAccessCohort) {
        return null;
      }

      return cohort;
    });
  },
);

export const retrieveCohortById = cache(async (id: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const cohort = await Cohort.byIdOrHandle({ id });

    if (!cohort) {
      return null;
    }

    const [isLocationAdmin, isInstructorInCohort] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: cohort?.locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listByPersonId({
        cohortId: cohort.id,
        personId: primaryPerson.id,
        actorType: "instructor",
      }).then((actors) => actors.length > 0),
    ]);

    const canAccessCohort =
      isLocationAdmin ||
      (isInstructorInCohort &&
        dayjs().isAfter(dayjs(cohort.accessStartTime)) &&
        dayjs().isBefore(dayjs(cohort.accessEndTime)));

    if (!canAccessCohort) {
      return null;
    }

    return cohort;
  });
});

export const createCohort = async ({
  locationId,
  label,
  accessStartTimestamp,
  accessEndTimestamp,
}: {
  locationId: string;
  label: string;
  accessStartTimestamp: string;
  accessEndTimestamp: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: primaryPerson.id,
    });

    const res = await Cohort.create({
      locationId,
      label,
      accessStartTime: accessStartTimestamp,
      accessEndTime: accessEndTimestamp,
      handle: slugify(label),
    });

    posthog.capture({
      distinctId: authUser.authUserId,
      event: "create_cohort",
      properties: {
        $set: { email: authUser.email, displayName: authUser.displayName },
      },
    });

    await posthog.shutdown();

    return res;
  });
};

export const submitProductFeedback = async ({
  type,
  headers,
  path,
  query,
  priority = "normal",
  message,
}: {
  type: "bug" | "product-feedback" | "question";
  query?: Record<string, string | string[]>;
  path?: string;
  headers?: Record<string, string>;
  priority?: "low" | "normal" | "high";
  message: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();

    const res = await Platform.Feedback.create({
      insertedBy: authUser.authUserId,
      type,
      headers,
      path,
      query,
      base: {
        env: process.env.NEXT_PUBLIC_VERCEL_ENV,
        version: packageInfo.version,
      },
      priority,
      message,
    });

    posthog.capture({
      distinctId: authUser.authUserId,
      event: "submit_feedback",
      properties: {
        $set: { email: authUser.email, displayName: authUser.displayName },
      },
    });

    await posthog.shutdown();

    return res;
  });
};

export const getIsActiveInstructor = cache(async () => {
  return makeRequest(async () => {
    const user = await getUserOrThrow().catch(() => null);

    if (!user) {
      return false;
    }

    // TODO: This should probably move to a check on the primary person
    const activeActorTypes = await User.Actor.listActiveTypesForUser({
      userId: user.authUserId,
    });

    return activeActorTypes.some((type) =>
      ["instructor", "location_admin"].includes(type),
    );
  });
});

export const getIsActiveInstructorByPersonId = cache(
  async (personId: string) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();

      if (!user.persons.some((p) => p.id === personId)) {
        return false;
      }

      return await User.Actor.listActiveTypesForUser({
        userId: user.authUserId,
        filter: {
          personId,
        },
      }).then((types) =>
        types.some((type) => ["instructor", "location_admin"].includes(type)),
      );
    });
  },
);

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "whatsapp"
  | "x"
  | "youtube";

export const updateLocationLogos = async (
  id: string,
  {
    logo,
    logoSquare,
    logoCertificate,
  }: {
    logo?: MediaType | null;
    logoSquare?: MediaType | null;
    logoCertificate?: MediaType | null;
  },
) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: id,
      personId: primaryPerson.id,
    });

    const location = await Location.fromId(id);
    const createOptions = { isPublic: true };

    const [
      { id: logoMediaId, remove: removeLogoMedia },
      { id: logoSquareMediaId, remove: removeLogoSquareMedia },
      { id: logoCertificateMediaId, remove: removeLogoCertificateMedia },
    ] = await Promise.all([
      createOrReplaceMedia(logo, location.logo?.id, createOptions),
      createOrReplaceMedia(logoSquare, location.logoSquare?.id, createOptions),
      createOrReplaceMedia(
        logoCertificate,
        location.logoCertificate?.id,
        createOptions,
      ),
    ]);

    await Location.updateDetails({
      id,
      logoMediaId,
      squareLogoMediaId: logoSquareMediaId,
      certificateMediaId: logoCertificateMediaId,
    });

    await Promise.all([
      removeLogoMedia?.(),
      removeLogoSquareMedia?.(),
      removeLogoCertificateMedia?.(),
    ]);
  });
};

export const updateLocationDetails = async (
  id: string,
  fields: Partial<{
    name: string;
    websiteUrl: string;
    email: string;
    shortDescription: string | null;
    googlePlaceId: string | null;
    socialMedia: {
      platform: SocialPlatform;
      url: string;
    }[];
  }>,
) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: id,
      personId: primaryPerson.id,
    });

    await Location.updateDetails({
      id,
      name: fields.name,
      websiteUrl: fields.websiteUrl,
      email: fields.email,
      shortDescription: fields.shortDescription,
      googlePlaceId: fields.googlePlaceId,
      socialMedia: fields.socialMedia,
    });

    return;
  });
};

export const updateLocationResources = async (
  id: string,
  {
    gearTypes,
    disciplines,
  }: {
    gearTypes: string[];
    disciplines: string[];
  },
) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: id,
      personId: primaryPerson.id,
    });

    await Location.updateResources({
      id,
      gearTypes,
      disciplines,
    });
  });
};

export const listStudentsWithCurriculaByCohortId = cache(
  async (cohortId: string) => {
    return makeRequest(async () => {
      const [authUser, cohort] = await Promise.all([
        getUserOrThrow(),
        Cohort.byIdOrHandle({ id: cohortId }),
      ]);

      if (!cohort) {
        throw new Error("Cohort not found");
      }

      const primaryPerson = await getPrimaryPerson(authUser);

      const [isLocationAdmin, isInstructorInCohort] = await Promise.all([
        isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId: cohort.locationId,
          personId: primaryPerson.id,
        }).catch(() => false),
        Cohort.Allocation.listByPersonId({
          cohortId,
          personId: primaryPerson.id,
          actorType: "instructor",
        }).then((actors) => actors.length > 0),
      ]);

      if (!isLocationAdmin && !isInstructorInCohort) {
        throw new Error("Unauthorized");
      }

      return Cohort.Allocation.listStudentsWithCurricula({ cohortId });
    });
  },
);

export const listCertificateOverviewByCohortId = cache(
  async (cohortId: string) => {
    return makeRequest(async () => {
      const [authUser, cohort] = await Promise.all([
        getUserOrThrow(),
        Cohort.byIdOrHandle({ id: cohortId }),
      ]);

      if (!cohort) {
        throw new Error("Cohort not found");
      }

      const primaryPerson = await getPrimaryPerson(authUser);

      const [isLocationAdmin, privileges] = await Promise.all([
        isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId: cohort.locationId,
          personId: primaryPerson.id,
        }).catch(() => false),
        Cohort.Allocation.listPrivilegesForPerson({
          cohortId,
          personId: primaryPerson.id,
        }),
      ]);

      if (!isLocationAdmin && !privileges.includes("manage_cohort_students")) {
        throw new Error("Unauthorized");
      }

      return await Cohort.Certificate.listStatus({ cohortId });
    });
  },
);

export const listInstructorsByCohortId = cache(async (cohortId: string) => {
  return makeRequest(async () => {
    // TODO: This needs authorization checks
    return await Cohort.Allocation.listInstructors({ cohortId });
  });
});

export const retrieveStudentAllocationWithCurriculum = cache(
  async (cohortId: string, allocationId: string) => {
    return makeRequest(async () => {
      const [authUser, cohort] = await Promise.all([
        getUserOrThrow(),
        Cohort.byIdOrHandle({ id: cohortId }),
      ]);

      if (!cohort) {
        throw new Error("Cohort not found");
      }

      const primaryPerson = await getPrimaryPerson(authUser);

      const [isLocationAdmin, isInstructorInCohort] = await Promise.all([
        isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId: cohort.locationId,
          personId: primaryPerson.id,
        }).catch(() => false),
        Cohort.Allocation.listByPersonId({
          cohortId,
          personId: primaryPerson.id,
          actorType: "instructor",
        }).then((actors) => actors.length > 0),
      ]);

      if (!isLocationAdmin && !isInstructorInCohort) {
        throw new Error("Unauthorized");
      }

      return await Cohort.Allocation.retrieveStudentWithCurriculum({
        cohortId,
        allocationId,
        respectCohortVisibility: !isLocationAdmin,
      });
    });
  },
);

export const retrieveStudentAllocationWithCurriculumForPerson = cache(
  async (allocationId: string) => {
    return makeRequest(async () => {
      const [authUser] = await Promise.all([getUserOrThrow()]);

      const result = await Cohort.Allocation.retrieveStudentWithCurriculum({
        allocationId,
        respectCohortVisibility: true,
        respectProgressVisibility: true,
      });

      if (!result) {
        return null;
      }

      if (!authUser.persons.some((p) => p.id === result.person.id)) {
        throw new Error("Unauthorized");
      }

      return result;
    });
  },
);

export const listCurriculaByPersonId = cache(
  async (personId: string | string[], atLeastOneModuleCompleted?: boolean) => {
    return makeRequest(async () => {
      // TODO: This needs authorization checks
      return await Student.Curriculum.listByPersonId({
        personId,
        filters: {
          atLeastOneModuleCompleted,
        },
      });
    });
  },
);

export const listCurriculaProgressByPersonId = cache(
  async (
    personId: string | string[],
    respectCertificateVisibility?: boolean,
    includeCurriculaWithoutProgress?: boolean,
  ) => {
    return makeRequest(async () => {
      // TODO: This needs authorization checks
      return await Student.Curriculum.listProgressByPersonId({
        personId,
        filters: {
          respectCertificateVisibility,
          includeCurriculaWithoutProgress,
        },
      });
    });
  },
);

export const listStudentCohortProgressByPersonId = cache(
  async (
    personId: string,
    respectProgressVisibility?: boolean,
    respectCohortVisibility?: boolean,
  ) => {
    return makeRequest(async () => {
      // TODO: This needs authorization checks
      return await Cohort.StudentProgress.listByPersonId({
        personId,
        respectProgressVisibility,
        respectCohortVisibility,
      });
    });
  },
);

export const listCompletedCompetenciesByStudentCurriculumId = cache(
  async (studentCurriculumId: string) => {
    return makeRequest(async () => {
      // TODO: This needs authorization checks
      return await Student.Curriculum.listCompletedCompetenciesById({
        id: studentCurriculumId,
      });
    });
  },
);

export const listCompetencyProgressInCohortForStudent = cache(
  async (allocationId: string, respectVisibility?: boolean) => {
    return makeRequest(async () => {
      // TODO: This needs authorization checks
      return await Cohort.StudentProgress.byAllocationId({
        id: allocationId,
        respectProgressVisibility: respectVisibility,
      });
    });
  },
);

export async function updateCompetencyProgress({
  cohortAllocationId,
  competencyProgress,
}: {
  cohortAllocationId: string;
  competencyProgress: {
    competencyId: string;
    progress: number;
  }[];
}) {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // const availableLocations = await User.Person.listLocationsByRole({
    //   personId: authPerson.id,
    //   roles: ["location_admin", "instructor"],
    // });

    // TODO: Check if the person is an instructor for the cohort

    await Cohort.StudentProgress.upsertProgress({
      cohortAllocationId,
      competencyProgress,
      createdBy: primaryPerson.id,
    });

    return;
  });
}

export async function completeAllCoreCompetencies({
  cohortAllocationId,
}: {
  cohortAllocationId: string | string[];
}) {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // const availableLocations = await User.Person.listLocationsByRole({
    //   personId: authPerson.id,
    //   roles: ["location_admin", "instructor"],
    // });

    // TODO: Check if the person is an instructor for the cohort

    await Cohort.StudentProgress.completeAllCoreCompetencies({
      cohortAllocationId,
      createdBy: primaryPerson.id,
    });

    return;
  });
}

export async function addStudentToCohortByPersonId({
  locationId,
  cohortId,
  personId,
  tags,
}: {
  locationId: string;
  cohortId: string;
  personId: string;
  tags?: string[];
}) {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: primaryPerson.id,
    });

    const actor = await Location.Person.getActorByPersonIdAndType({
      locationId,
      actorType: "student",
      personId,
    });

    if (!actor) {
      throw new Error("No actor found");
    }

    const result = await Cohort.Allocation.create({
      cohortId,
      actorId: actor.id,
    });

    if (!!tags && tags.length > 0) {
      await Cohort.Allocation.setTags({
        allocationId: result.id,
        tags,
      });
    }

    return result;
  });
}

export async function releaseStudentFromCohortByAllocationId({
  locationId,
  cohortId,
  allocationId,
}: {
  locationId: string;
  cohortId: string;
  allocationId: string;
}) {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const [isLocationAdmin, privileges] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listPrivilegesForPerson({
        cohortId,
        personId: primaryPerson.id,
      }),
    ]);
    if (!isLocationAdmin && !privileges.includes("manage_cohort_students")) {
      throw new Error("Unauthorized");
    }

    // Force check if it really is a student, not an instructor
    const allocation = await Cohort.Allocation.retrieveAllocationById({
      allocationId,
    });

    if (!allocation) {
      throw new Error("Allocation not found");
    }

    if (allocation.cohort.id !== cohortId) {
      throw new Error("Allocation does not belong to cohort");
    }

    if (allocation.actor.type !== "student") {
      throw new Error("Allocation is not a student");
    }

    const result = await Cohort.Allocation.remove({
      id: allocationId,
    });

    return result;
  });
}

export async function addInstructorToCohortByPersonId({
  locationId,
  cohortId,
  personId,
}: {
  locationId: string;
  cohortId: string;
  personId: string;
}) {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const [isLocationAdmin, privileges] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listPrivilegesForPerson({
        cohortId,
        personId: primaryPerson.id,
      }),
    ]);

    if (!isLocationAdmin && !privileges.includes("manage_cohort_instructors")) {
      throw new Error("Unauthorized");
    }

    const actor = await Location.Person.getActorByPersonIdAndType({
      locationId,
      actorType: "instructor",
      personId,
    });

    if (!actor) {
      throw new Error("No actor found");
    }

    return await Cohort.Allocation.create({
      cohortId,
      actorId: actor.id,
    });
  });
}

export async function moveAllocationById({
  locationId,
  allocationId,
  cohortId,
  newCohortId,
}: {
  locationId: string;
  allocationId: string;
  cohortId: string;
  newCohortId: string;
}) {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const [isLocationAdmin, privilegesInCohort, privilegesInNewCohort] =
      await Promise.all([
        isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId,
          personId: primaryPerson.id,
        }).catch(() => false),
        Cohort.Allocation.listPrivilegesForPerson({
          cohortId,
          personId: primaryPerson.id,
        }),
        Cohort.Allocation.listPrivilegesForPerson({
          cohortId: newCohortId,
          personId: primaryPerson.id,
        }),
      ]);

    if (
      !isLocationAdmin &&
      // TODO: This should be a separate check, but for now we only have one role
      (!privilegesInCohort.some((p) =>
        ["manage_cohort_students", "manage_cohort_instructors"].includes(p),
      ) ||
        !privilegesInNewCohort.some((p) =>
          ["manage_cohort_students", "manage_cohort_instructors"].includes(p),
        ))
    ) {
      throw new Error("Unauthorized");
    }

    return await Cohort.Allocation.move({
      id: allocationId,
      cohortId: newCohortId,
    });
  });
}

export async function removeAllocationById({
  locationId,
  allocationId,
  cohortId,
}: {
  locationId: string;
  allocationId: string;
  cohortId: string;
}) {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const [isLocationAdmin, privileges] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listPrivilegesForPerson({
        cohortId,
        personId: primaryPerson.id,
      }),
    ]);

    if (
      !isLocationAdmin &&
      // TODO: This should be a separate check, but for now we only have one role
      !privileges.some((p) =>
        ["manage_cohort_students", "manage_cohort_instructors"].includes(p),
      )
    ) {
      throw new Error("Unauthorized");
    }

    const cohortIdForAllocation =
      await Cohort.Allocation.retrieveAllocationById({
        allocationId,
      });

    if (!cohortIdForAllocation) {
      throw new Error("Allocation not found");
    }

    if (cohortIdForAllocation.cohort.id !== cohortId) {
      throw new Error("Allocation does not belong to cohort");
    }

    await Cohort.Allocation.remove({ id: allocationId });
  });
}

export const isInstructorInCohort = cache(async (cohortId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const [possibleInstructorActor] = await Cohort.Allocation.listByPersonId({
      cohortId,
      personId: primaryPerson.id,
      actorType: "instructor",
    });

    if (!possibleInstructorActor) {
      return undefined;
    }

    return {
      ...possibleInstructorActor,
      personId: primaryPerson.id,
    } as {
      actorId: string;
      type: "instructor";
      allocationId: string;
      personId: string;
    };
  });
});

export const listRolesForLocation = cache(
  async (locationId: string, personId?: string) => {
    return makeRequest(async () => {
      const authUser = await getUserOrThrow();
      const primaryPerson = await getPrimaryPerson(authUser);

      if (personId) {
        await validatePersonAccessCheck({
          locationId,
          requestedPersonId: personId,
          requestingUser: authUser,
        });
      }

      return await User.Person.listActiveRolesForLocation({
        locationId,
        personId: personId ?? primaryPerson.id,
      });
    });
  },
);

export const listPrivilegesForCohort = cache(async (cohortId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    return await Cohort.Allocation.listPrivilegesForPerson({
      cohortId,
      personId: primaryPerson.id,
    });
  });
});

export async function updateStudentInstructorAssignment({
  action,
  cohortId,
  studentAllocationIds,
  instructorPersonId,
}:
  | {
      cohortId: string;
      studentAllocationIds: string[];
      action: "claim";
      instructorPersonId?: string;
    }
  | {
      cohortId: string;
      studentAllocationIds: string[];
      action: "release";
      instructorPersonId?: never;
    }) {
  return makeRequest(async () => {
    const [cohort, primaryPerson] = await Promise.all([
      Cohort.byIdOrHandle({ id: cohortId }).then(
        (cohort) => cohort ?? notFound(),
      ),
      getUserOrThrow().then(getPrimaryPerson),
    ]);

    const instructorId =
      action === "claim" ? (instructorPersonId ?? primaryPerson.id) : null;

    const instructorActor = instructorId
      ? await Location.Person.getActorByPersonIdAndType({
          locationId: cohort.locationId,
          actorType: "instructor",
          personId: instructorId,
        })
      : null;

    if (!!instructorId && !instructorActor) {
      throw new Error("User is not an instructor for this location");
    }

    return Cohort.Allocation.setInstructorForStudent({
      cohortId,
      instructorActorId: instructorActor?.id ?? null,
      studentAllocationId: studentAllocationIds,
    }).catch((e) => {
      console.error("Error updating student instructor assignment", e);
      throw e;
    });
  });
}

export const enrollStudentsInCurriculumForCohort = async ({
  curriculumId,
  gearTypeId,
  cohortId,
  students,
}: {
  curriculumId: string;
  gearTypeId: string;
  cohortId: string;
  students: {
    allocationId: string;
    personId: string;
  }[];
}) => {
  return makeRequest(async () => {
    return withTransaction(async () => {
      const authUser = await getUserOrThrow();
      const _authPerson = await getPrimaryPerson(authUser);

      // TODO: Update authorization

      // if (!authPerson) {
      //   throw new Error("Person not found for user");
      // }

      // const availableLocations = await User.Person.listLocationsByRole({
      //   personId: authPerson.id,
      //   roles: ["location_admin"],
      // });

      // if (!availableLocations.some((l) => l.locationId === locationId)) {
      //   throw new Error("Location not found for person");
      // }

      for await (const student of students) {
        const studentCurriculum = await Student.Curriculum.findOrEnroll({
          curriculumId,
          gearTypeId,
          personId: student.personId,
        });

        await Cohort.Allocation.setStudentCurriculum({
          cohortId,
          studentAllocationId: student.allocationId,
          studentCurriculumId: studentCurriculum.id,
        });
      }

      return;
    });
  });
};

export const withdrawStudentFromCurriculumInCohort = async ({
  allocationId,
}: {
  allocationId: string;
}) => {
  return makeRequest(async () => {
    return withTransaction(async () => {
      const authUser = await getUserOrThrow();
      const _primaryPerson = await getPrimaryPerson(authUser);

      // TODO: Update authorization

      // const [isLocationAdmin, privileges] = await Promise.all([
      //   isActiveActorTypeInLocation({
      //     actorType: ["location_admin"],
      //     locationId: cohort.locationId,
      //     personId: primaryPerson.id,
      //   }).catch(() => false),
      //   Cohort.Allocation.listPrivilegesForPerson({
      //     cohortId,
      //     personId: primaryPerson.id,
      //   }),
      // ]);

      // if (!isLocationAdmin && !privileges.includes("manage_cohort_students")) {
      //   throw new Error("Unauthorized");
      // }

      await Cohort.Allocation.releaseStudentCurriculum({
        studentAllocationId: allocationId,
      });

      return;
    });
  });
};

export async function addCohortRole({
  allocationId,
  roleHandle,
  cohortId,
}: {
  cohortId: string;
  allocationId: string;
  roleHandle: "cohort_admin";
}) {
  return makeRequest(async () => {
    const [authUser, cohort] = await Promise.all([
      getUserOrThrow(),
      Cohort.byIdOrHandle({ id: cohortId }).then(
        (cohort) => cohort ?? notFound(),
      ),
    ]);

    const primaryPerson = await getPrimaryPerson(authUser);

    const [isLocationAdmin, privileges] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: cohort.locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listPrivilegesForPerson({
        cohortId,
        personId: primaryPerson.id,
      }),
    ]);

    if (!isLocationAdmin && !privileges.includes("manage_cohort_instructors")) {
      throw new Error("Unauthorized");
    }

    return await Cohort.Allocation.addRole({
      cohortId,
      allocationId,
      roleHandle,
    });
  });
}

export async function removeCohortRole({
  allocationId,
  roleHandle,
  cohortId,
}: {
  cohortId: string;
  allocationId: string;
  roleHandle: "cohort_admin";
}) {
  return makeRequest(async () => {
    const [authUser, cohort] = await Promise.all([
      getUserOrThrow(),
      Cohort.byIdOrHandle({ id: cohortId }).then(
        (cohort) => cohort ?? notFound(),
      ),
    ]);

    const primaryPerson = await getPrimaryPerson(authUser);

    const [isLocationAdmin, privileges] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: cohort.locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listPrivilegesForPerson({
        cohortId,
        personId: primaryPerson.id,
      }),
    ]);

    if (!isLocationAdmin && !privileges.includes("manage_cohort_instructors")) {
      throw new Error("Unauthorized");
    }

    return await Cohort.Allocation.withdrawlRole({
      cohortId,
      allocationId,
      roleHandle,
    });
  });
}

export async function setAllocationTags({
  allocationId,
  cohortId,
  tags,
}: {
  cohortId: string;
  allocationId: string | string[];
  tags: string[];
}) {
  return makeRequest(async () => {
    const [primaryPerson, cohort] = await Promise.all([
      getUserOrThrow().then(getPrimaryPerson),
      Cohort.byIdOrHandle({ id: cohortId }).then(
        (cohort) => cohort ?? notFound(),
      ),
    ]);

    const [isLocationAdmin, privileges] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: cohort.locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listPrivilegesForPerson({
        cohortId,
        personId: primaryPerson.id,
      }),
    ]);

    if (!isLocationAdmin && !privileges.includes("manage_cohort_students")) {
      throw new Error("Unauthorized");
    }

    return await Cohort.Allocation.setTags({
      allocationId,
      tags,
    });
  });
}

export const listDistinctTagsForCohort = async (cohortId: string) => {
  return makeRequest(async () => {
    const [primaryPerson, cohort] = await Promise.all([
      getUserOrThrow().then(getPrimaryPerson),
      Cohort.byIdOrHandle({ id: cohortId }).then(
        (cohort) => cohort ?? notFound(),
      ),
    ]);

    const [isLocationAdmin, rolesInCohort] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: cohort.locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listByPersonId({
        cohortId,
        personId: primaryPerson.id,
      }).then((actors) => actors.map((actor) => actor.type)),
    ]);

    if (!isLocationAdmin && !rolesInCohort.includes("instructor")) {
      throw new Error("Unauthorized");
    }

    return await Cohort.listDistinctTags({
      cohortId,
    });
  });
};
export async function upsertActorForLocation({
  locationId,
  personId,
  type,
}: {
  locationId: string;
  personId: string;
  type: LocationActorType;
}) {
  return makeRequest(async () => {
    const [primaryPerson] = await Promise.all([
      getUserOrThrow().then(getPrimaryPerson),
    ]);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: locationId,
      personId: primaryPerson.id,
    });

    return await User.Actor.upsert({
      locationId,
      type,
      personId,
    });
  });
}

export async function dropActorForLocation({
  locationId,
  personId,
  type,
}: {
  locationId: string;
  personId: string;
  type: LocationActorType;
}) {
  return makeRequest(async () => {
    const [primaryPerson] = await Promise.all([
      getUserOrThrow().then(getPrimaryPerson),
    ]);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: locationId,
      personId: primaryPerson.id,
    });

    return await User.Actor.remove({
      locationId,
      type,
      personId,
    });
  });
}

export async function updateEmailForPerson({
  personId,
  locationId,
  email,
}: {
  personId: string;
  email: string;
  locationId?: string;
}) {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    if (locationId) {
      const primaryPerson = await getPrimaryPerson(user);

      await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: locationId,
        personId: primaryPerson.id,
      });
    } else if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
      throw new Error("Unauthorized");
    }

    return await User.Person.moveToAccountByEmail({
      email,
      personId,
    });
  });
}

export const listKnowledgeCenterDocuments = cache(
  async (filter?: {
    q?: string;
  }) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();

      const activeActorTypes = await User.Actor.listActiveTypesForUser({
        userId: user.authUserId,
      });

      if (
        !activeActorTypes.some((type) =>
          ["instructor", "location_admin"].includes(type),
        )
      ) {
        throw new Error("Unauthorized");
      }

      return await Platform.Media.listKnowledgeCenterDocuments({
        filter,
      });
    });
  },
);

export const downloadKnowledgeCenterDocument = cache(
  async (documentId: string, forceDownload = true) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();

      const activeActorTypes = await User.Actor.listActiveTypesForUser({
        userId: user.authUserId,
      });

      if (
        !activeActorTypes.some((type) =>
          ["instructor", "location_admin"].includes(type),
        )
      ) {
        throw new Error("Unauthorized");
      }

      return await Platform.Media.createSignedUrl({
        id: documentId,
        download: forceDownload,
      });
    });
  },
);

export const retrieveDefaultCertificateVisibleFromDate = cache(
  async (cohortId: string) => {
    return makeRequest(async () => {
      const [authUser, cohort] = await Promise.all([
        getUserOrThrow(),
        Cohort.byIdOrHandle({ id: cohortId }),
      ]);

      if (!cohort) {
        throw new Error("Cohort not found");
      }

      const primaryPerson = await getPrimaryPerson(authUser);

      const [isLocationAdmin, privileges] = await Promise.all([
        isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId: cohort.locationId,
          personId: primaryPerson.id,
        }).catch(() => false),
        Cohort.Allocation.listPrivilegesForPerson({
          cohortId,
          personId: primaryPerson.id,
        }),
      ]);

      if (
        !isLocationAdmin &&
        !privileges.includes("manage_cohort_certificate")
      ) {
        throw new Error("Unauthorized");
      }

      return await Cohort.getDefaultVisibleFromDate({
        cohortId,
      });
    });
  },
);

export const updateDefaultCertificateVisibleFromDate = async ({
  cohortId,
  visibleFrom,
}: {
  cohortId: string;
  visibleFrom: string;
}) => {
  return makeRequest(async () => {
    const [authUser, cohort] = await Promise.all([
      getUserOrThrow(),
      Cohort.byIdOrHandle({ id: cohortId }),
    ]);

    if (!cohort) {
      throw new Error("Cohort not found");
    }

    const primaryPerson = await getPrimaryPerson(authUser);

    const [isLocationAdmin, privileges] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: cohort.locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listPrivilegesForPerson({
        cohortId,
        personId: primaryPerson.id,
      }),
    ]);

    if (!isLocationAdmin && !privileges.includes("manage_cohort_certificate")) {
      throw new Error("Unauthorized");
    }

    return await Cohort.setDefaultVisibleFromDate({
      cohortId,
      visibleFromDate: visibleFrom,
    });
  });
};
export const updateCohortDetails = async ({
  cohortId,
  label,
  accessStartTimestamp,
  accessEndTimestamp,
}: {
  cohortId: string;
  label?: string;
  accessStartTimestamp?: string;
  accessEndTimestamp?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const cohort = await Cohort.byIdOrHandle({ id: cohortId });

    if (!cohort) {
      throw new Error("Cohort not found");
    }

    if (!accessStartTimestamp || !accessEndTimestamp) {
      // TODO: These are required for now, which doesn't match the type.
      // We first need to fix the data integrity check in `core`
      throw new Error("Access start and end timestamps are required");
    }

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: cohort.locationId,
      personId: primaryPerson.id,
    });

    return await Cohort.update({
      id: cohortId,
      data: {
        label,
        accessStartTime: accessStartTimestamp,
        accessEndTime: accessEndTimestamp,
      },
    });
  });
};

export const deleteCohort = async (cohortId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const cohort = await Cohort.byIdOrHandle({ id: cohortId });

    if (!cohort) {
      throw new Error("Cohort not found");
    }

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: cohort.locationId,
      personId: primaryPerson.id,
    });

    return await Cohort.remove({ id: cohortId });
  });
};

export const updatePersonDetails = async ({
  personId,
  locationId,
  ...details
}: {
  personId: string;
  locationId?: string | null;
  firstName?: string;
  lastNamePrefix?: string | null;
  lastName?: string;
  dateOfBirth?: Date;
  birthCity?: string;
  birthCountry?: string;
}) => {
  return makeRequest(async () => {
    const [user, person] = await Promise.all([
      getUserOrThrow(),
      User.Person.byIdOrHandle({ id: personId }),
    ]);

    if (!person) {
      throw new Error("Person not found");
    }

    if (locationId) {
      const primaryPerson = await getPrimaryPerson(user);
      await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: locationId,
        personId: primaryPerson.id,
      });

      const associatedToLocation = await User.Person.listActiveRolesForLocation(
        {
          locationId,
          personId,
        },
      ).then((roles) => roles.length > 0);

      if (!associatedToLocation) {
        throw new Error("Unauthorized");
      }
    } else if (!isSecretariaat(user.email) && !isSystemAdmin(user.email)) {
      const primaryPerson = await getPrimaryPerson(user);
      if (person.userId !== primaryPerson.userId) {
        throw new Error("Unauthorized");
      }
    }

    return await User.Person.updateDetails({
      personId,
      data: {
        ...details,
        dateOfBirth: details.dateOfBirth?.toISOString(),
      },
    });
  });
};

export const storeCertificateHandles = async (props: {
  handles: string[];
  fileName?: string;
  sort?: "student" | "instructor";
}) => {
  return makeRequest(async () => {
    return await withRedisClient(redisConfig, async () => {
      return await Certificate.storeHandles(props);
    });
  });
};

export const retrieveCertificateHandles = async (uuid: string) => {
  return makeRequest(async () => {
    return await withRedisClient(redisConfig, async () => {
      return await Certificate.retrieveHandles({ uuid });
    });
  });
};

export const makeProgressVisible = async ({
  cohortId,
  allocationId,
}: {
  cohortId: string;
  allocationId: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const cohort = await Cohort.byIdOrHandle({ id: cohortId });

    if (!cohort) {
      return null;
    }

    const [isLocationAdmin, isInstructorInCohort] = await Promise.all([
      isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId: cohort?.locationId,
        personId: primaryPerson.id,
      }).catch(() => false),
      Cohort.Allocation.listByPersonId({
        cohortId: cohort.id,
        personId: primaryPerson.id,
        actorType: "instructor",
      }).then((actors) => actors.length > 0),
    ]);

    const canAccessCohort =
      isLocationAdmin ||
      (isInstructorInCohort &&
        dayjs().isAfter(dayjs(cohort.accessStartTime)) &&
        dayjs().isBefore(dayjs(cohort.accessEndTime)));

    if (!canAccessCohort) {
      return null;
    }

    return await Cohort.Allocation.makeProgressVisible({
      allocationId,
    });
  });
};

export const listAllocationHistory = cache(
  async (allocationId: string, cohortId: string) => {
    return makeRequest(async () => {
      const authUser = await getUserOrThrow();
      const primaryPerson = await getPrimaryPerson(authUser);

      // TODO: check if allocation belongs to cohort

      const cohort = await Cohort.byIdOrHandle({ id: cohortId });

      if (!cohort) {
        return null;
      }

      const [isLocationAdmin, isInstructorInCohort] = await Promise.all([
        isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId: cohort?.locationId,
          personId: primaryPerson.id,
        }).catch(() => false),
        Cohort.Allocation.listByPersonId({
          cohortId: cohort.id,
          personId: primaryPerson.id,
          actorType: "instructor",
        }).then((actors) => actors.length > 0),
      ]);

      const now = dayjs();

      const canAccessCohort =
        isLocationAdmin ||
        (isInstructorInCohort &&
          now.isAfter(dayjs(cohort.accessStartTime)) &&
          now.isBefore(dayjs(cohort.accessEndTime)));

      if (!canAccessCohort) {
        return null;
      }

      return await Cohort.StudentProgress.retrieveHistoryByAllocationId({
        allocationId,
      });
    });
  },
);

export const listLogbooksForPerson = async ({
  personId,
  locationId,
}: {
  personId: string;
  locationId?: string;
}) => {
  return makeRequest(async () => {
    const requestingUser = await getUserOrThrow();

    const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

    if (!isSelf) {
      if (!locationId) {
        throw new Error("Unauthorized");
      }

      await validatePersonAccessCheck({
        locationId,
        requestedPersonId: personId,
        requestingUser,
      });
    }

    return await Logbook.listForPerson({ personId });
  });
};

export const createLogbook = async ({
  personId,
  fields,
}: {
  personId: string;
  fields: {
    startedAt: string;
    endedAt: string | null;
    departurePort: string | null;
    arrivalPort: string | null;
    windPower: number | null;
    windDirection: string | null;
    boatType: string | null;
    boatLength: number | null;
    location: string | null;
    sailedNauticalMiles: number | null;
    sailedHoursInDark: number | null;
    primaryRole: string | null;
    crewNames: string | null;
    conditions: string | null;
    additionalComments: string | null;
  };
}) => {
  return makeRequest(async () => {
    const requestingUser = await getUserOrThrow();

    const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

    if (!isSelf) {
      throw new Error("Unauthorized");
    }

    return await Logbook.create({
      personId,
      ...fields,
    });
  });
};

export const updateLogbook = async ({
  id,
  personId,
  fields,
}: {
  id: string;
  personId: string;
  fields: {
    startedAt?: string;
    endedAt?: string | null;
    departurePort?: string | null;
    arrivalPort?: string | null;
    windPower?: number | null;
    windDirection?: string | null;
    boatType?: string | null;
    boatLength?: number | null;
    location?: string | null;
    sailedNauticalMiles?: number | null;
    sailedHoursInDark?: number | null;
    primaryRole?: string | null;
    crewNames?: string | null;
    conditions?: string | null;
    additionalComments?: string | null;
  };
}) => {
  return makeRequest(async () => {
    const requestingUser = await getUserOrThrow();

    const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

    if (!isSelf) {
      throw new Error("Unauthorized");
    }

    const logbook = await Logbook.byId({ id });

    if (!logbook) {
      throw new Error("Logbook not found");
    }

    if (logbook.personId !== personId) {
      throw new Error("Unauthorized");
    }

    return await Logbook.update({
      id,
      ...fields,
    });
  });
};

export const removeLogbook = async ({
  id,
  personId,
}: {
  id: string;
  personId: string;
}) => {
  return makeRequest(async () => {
    const requestingUser = await getUserOrThrow();

    const isSelf = requestingUser.persons.map((p) => p.id).includes(personId);

    if (!isSelf) {
      throw new Error("Unauthorized");
    }

    const logbook = await Logbook.byId({ id });

    if (!logbook) {
      throw new Error("Logbook not found");
    }

    if (logbook.personId !== personId) {
      throw new Error("Unauthorized");
    }

    return await Logbook.remove(id);
  });
};

export const createCashback = async ({
  media,
  fields,
}: {
  media: MediaType;
  fields: {
    applicantFullName: string;
    applicantEmail: string;
    studentFullName: string;
    verificationLocation: string;
    bookingLocationId: string;
    bookingNumber: string;
    applicantIban: string;
    newsletter: boolean;
  };
}) => {
  return makeRequest(async () => {
    const { id: mediaId } = await createOrReplaceMedia(media);

    return await Marketing.Cashback.create({
      ...fields,
      verificationMediaId: mediaId,
    });
  });
};

export const listAllCashbacks = cache(async () => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    // Check if user is super admin
    const isSuperAdmin = user.email === "info@nationaalwatersportdiploma.nl";

    if (!isSuperAdmin) {
      throw new Error("Unauthorized");
    }

    return await Marketing.Cashback.listAll();
  });
});

export const updateCurrentUserDisplayName = async (displayName: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();

    await User.updateDisplayName({
      userId: authUser.authUserId,
      displayName,
    });

    posthog.capture({
      distinctId: authUser.authUserId,
      event: "update_display_name",
      properties: {
        $set: { email: authUser.email, displayName: displayName },
      },
    });

    await posthog.shutdown();
  });
};

export const listPvbs = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: person.id,
    });

    const pvbs = await Pvb.Aanvraag.list({
      filter: { locationId },
    });

    return pvbs.items;
  });
});

export const listPvbsWithPagination = cache(
  async (
    locationId: string,
    { q, limit, offset }: { q: string; limit: number; offset: number },
  ) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: person.id,
      });

      return await Pvb.Aanvraag.list({
        filter: { locationId, q },
        limit,
        offset,
      });
    });
  },
);

export const listKssNiveaus = cache(async () => {
  return makeRequest(async () => {
    return await KSS.Kwalificatieprofiel.listNiveaus();
  });
});

export const listKssKwalificatieprofielenWithOnderdelen = cache(
  async (niveauId: string) => {
    return makeRequest(async () => {
      return await KSS.Kwalificatieprofiel.listWithOnderdelen({
        niveauId,
      });
    });
  },
);

export const listKssKwalificatieprofielen = cache(
  async (filter?: {
    richting?: "instructeur" | "leercoach" | "pvb_beoordelaar";
    niveauId?: string;
  }) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      // This is a secretariaat function, so we need to verify access
      // For now, we'll allow any logged in user, but you may want to restrict this
      return await KSS.Kwalificatieprofiel.list({ filter: filter || {} });
    });
  },
);

export const listKssInstructiegroepen = cache(
  async (filter?: {
    richting?: "instructeur" | "leercoach" | "pvb_beoordelaar";
  }) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      return await KSS.InstructieGroep.list({ filter: filter || {} });
    });
  },
);

export const listKssInstructiegroepenWithCourses = cache(
  async (filter?: {
    richting?: "instructeur" | "leercoach" | "pvb_beoordelaar";
  }) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      return await KSS.InstructieGroep.listWithCourses({
        filter: filter || {},
      });
    });
  },
);

export const getInstructiegroepByCourseId = cache(
  async (
    courseId: string,
    richting: "instructeur" | "leercoach" | "pvb_beoordelaar",
  ) => {
    return makeRequest(async () => {
      const result = await KSS.InstructieGroep.findByCourseId({
        courseId,
        richting,
      });

      return result;
    });
  },
);

export const getIsActiveStudent = cache(async () => {
  return makeRequest(async () => {
    const user = await getUserOrThrow().catch(() => null);

    if (!user) {
      return false;
    }

    // TODO: This should probably move to a check on the primary person
    const activeActorTypes = await User.Actor.listActiveTypesForUser({
      userId: user.authUserId,
    });

    return activeActorTypes.some((type) => ["student"].includes(type));
  });
});

export const listActiveActorTypesForPerson = cache(async (personId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow().catch(() => null);

    if (!user?.persons.find((p) => p.id === personId)) {
      throw new Error("Unauthorized");
    }

    const activeActorTypes = await User.Actor.listActiveTypesForUser({
      userId: user.authUserId,
      filter: {
        personId,
      },
    });

    return activeActorTypes;
  });
});

export const getActiveActorTypes = async () => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    return User.Actor.listActiveTypesForUser({
      userId: user.authUserId,
    });
  });
};

export const retrievePvbAanvraagByHandle = async (handle: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const aanvraag = await Pvb.Aanvraag.retrieveByHandle({ handle });

    // Check if user has access to this PVB aanvraag
    const isLocationAdmin = await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: aanvraag.locatie.id,
      personId: primaryPerson.id,
    }).catch(() => false);

    const isLeercoach = aanvraag.leercoach?.id === primaryPerson.id;
    const isBeoordelaar = aanvraag.onderdelen.some(
      (o) => o.beoordelaar?.id === primaryPerson.id,
    );
    const isKandidaat = aanvraag.kandidaat?.id === primaryPerson.id;

    // User must be either a location admin, the assigned leercoach, or a beoordelaar
    if (!isLocationAdmin && !isLeercoach && !isBeoordelaar && !isKandidaat) {
      throw new Error("Unauthorized");
    }

    return aanvraag;
  });
};

export const listPvbsForPersonAsKandidaat = cache(async (personId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();

    // Check if the user is viewing their own data
    const isSelf = authUser.persons.some((p) => p.id === personId);
    if (!isSelf) {
      throw new Error("Unauthorized");
    }

    // Use the new filter to get all PvBs where person is kandidaat in a single query
    const result = await Pvb.Aanvraag.list({
      filter: {
        kandidaatId: personId,
      },
    });

    return result.items;
  });
});

export const listPvbsForPersonAsLeercoach = cache(async (personId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();

    // Check if the user is viewing their own data
    const isSelf = authUser.persons.some((p) => p.id === personId);
    if (!isSelf) {
      throw new Error("Unauthorized");
    }

    // Use the new filter to get all PvBs where person is leercoach in a single query
    const result = await Pvb.Aanvraag.list({
      filter: {
        leercoachId: personId,
      },
    });

    return result.items;
  });
});

export const listPvbsForPersonAsBeoordelaar = cache(
  async (personId: string) => {
    return makeRequest(async () => {
      const authUser = await getUserOrThrow();

      // Check if the user is viewing their own data
      const isSelf = authUser.persons.some((p) => p.id === personId);
      if (!isSelf) {
        throw new Error("Unauthorized");
      }

      // Use the new filter to get all PvBs where person is beoordelaar in a single query
      const result = await Pvb.Aanvraag.list({
        filter: {
          beoordelaarId: personId,
        },
      });

      return result.items;
    });
  },
);

export const grantPvbLeercoachPermissionAsLeercoach = async ({
  pvbAanvraagIds,
  reden,
}: {
  pvbAanvraagIds: string[];
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    if (pvbAanvraagIds.length === 0) {
      throw new Error("Geen PVB aanvragen opgegeven");
    }

    // Type assertion after length check
    const nonEmptyPvbAanvraagIds = pvbAanvraagIds as [string, ...string[]];

    const allAanvragen = await Pvb.Aanvraag.list({
      filter: {
        id: nonEmptyPvbAanvraagIds,
      },
    });

    if (allAanvragen.items.length !== nonEmptyPvbAanvraagIds.length) {
      throw new Error("Een of meer PVB aanvragen zijn niet gevonden");
    }

    if (
      allAanvragen.items.some(
        (aanvraag) => aanvraag.leercoach?.id !== primaryPerson.id,
      )
    ) {
      throw new Error("Je bent geen leercoach voor een van deze aanvragen");
    }

    return await Pvb.Aanvraag.grantLeercoachPermissionForMultiple({
      pvbAanvraagIds: nonEmptyPvbAanvraagIds.map((id) => {
        const relevantAanvraag = allAanvragen.items.find(
          (aanvraag) => aanvraag.id === id,
        );
        if (!relevantAanvraag) {
          throw new Error("Aanvraag niet gevonden");
        }

        const relevantActor = primaryPerson.actors.find(
          (actor) =>
            actor.type === "instructor" &&
            actor.locationId === relevantAanvraag.locatie?.id,
        );

        if (!relevantActor) {
          throw new Error("Je bent geen instructeur voor deze locatie");
        }

        return {
          id,
          aangemaaktDoor: relevantActor.id,
        };
      }) as [
        { id: string; aangemaaktDoor: string },
        ...{ id: string; aangemaaktDoor: string }[],
      ],
      reden: reden || "Toestemming gegeven door leercoach",
    });
  });
};

export const listPvbGebeurtenissen = async (pvbAanvraagId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const result = await Pvb.Aanvraag.listGebeurtenissen({ pvbAanvraagId });

    return result.items;
  });
};

export const getPvbToetsdocumenten = async (pvbAanvraagId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const result = await Pvb.Aanvraag.getToetsdocumenten({ pvbAanvraagId });

    return result;
  });
};

export const getPvbBeoordelingsCriteria = async (pvbAanvraagId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    const result = await Pvb.Aanvraag.getBeoordelingsCriteria({
      pvbAanvraagId,
    });

    return result;
  });
};

export const updatePvbLeercoach = async ({
  pvbAanvraagId,
  leercoachId,
}: {
  pvbAanvraagId: string;
  leercoachId: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the PVB aanvraag to retrieve the location
    const aanvraag = await Pvb.Aanvraag.retrieveById({ id: pvbAanvraagId });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: aanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    await Pvb.Aanvraag.updateLeercoach({
      pvbAanvraagId,
      leercoachId,
      aangemaaktDoor: locationAdminActor.id,
    });
  });
};

export const updatePvbBeoordelaar = async ({
  pvbAanvraagId,
  beoordelaarId,
}: {
  pvbAanvraagId: string;
  beoordelaarId: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the PVB aanvraag to retrieve the location
    const aanvraag = await Pvb.Aanvraag.retrieveById({ id: pvbAanvraagId });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: aanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    await Pvb.Aanvraag.updateBeoordelaarForAll({
      pvbAanvraagId,
      beoordelaarId,
      aangemaaktDoor: locationAdminActor.id,
    });
  });
};

export const updatePvbStartTime = async ({
  pvbAanvraagId,
  startDatumTijd,
}: {
  pvbAanvraagId: string;
  startDatumTijd: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the PVB aanvraag to retrieve the location
    const aanvraag = await Pvb.Aanvraag.retrieveById({ id: pvbAanvraagId });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: aanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    await Pvb.Aanvraag.updateStartTime({
      pvbAanvraagId,
      startDatumTijd: dayjs(startDatumTijd).toISOString(),
      aangemaaktDoor: locationAdminActor.id,
    });
  });
};

export const grantPvbLeercoachPermission = async ({
  pvbAanvraagId,
  reden,
}: {
  pvbAanvraagId: string;
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the PVB aanvraag to retrieve the location
    const aanvraag = await Pvb.Aanvraag.retrieveById({ id: pvbAanvraagId });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: aanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    await Pvb.Aanvraag.grantLeercoachPermission({
      pvbAanvraagId,
      aangemaaktDoor: locationAdminActor.id,
      reden:
        reden || "Toestemming gegeven door locatiebeheerder namens leercoach",
    });
  });
};

export const submitPvbAanvraag = async ({
  pvbAanvraagId,
}: {
  pvbAanvraagId: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the PVB aanvraag to retrieve the location
    const aanvraag = await Pvb.Aanvraag.retrieveById({ id: pvbAanvraagId });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: aanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    await Pvb.Aanvraag.submitAanvraag({
      pvbAanvraagId,
      aangemaaktDoor: locationAdminActor.id,
      reden: "Aanvraag geactiveerd via locatiebeheer",
    });
  });
};

export const withdrawPvbAanvraag = async ({
  pvbAanvraagId,
  reden,
}: {
  pvbAanvraagId: string;
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the PVB aanvraag to retrieve the location
    const aanvraag = await Pvb.Aanvraag.retrieveById({ id: pvbAanvraagId });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: aanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    await Pvb.Aanvraag.withdrawAanvraag({
      pvbAanvraagId,
      aangemaaktDoor: locationAdminActor.id,
      reden: reden || "Aanvraag ingetrokken via locatiebeheer",
    });
  });
};

export const getKssKerntaakDetails = cache(async (kerntaakId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    // Get the kerntaak
    const kerntaak = await KSS.Kwalificatieprofiel.getKerntaakById({
      kerntaakId,
    });

    if (!kerntaak) {
      return null;
    }

    // Get the kwalificatieprofiel details
    const kwalificatieprofiel = await KSS.Kwalificatieprofiel.byId({
      id: kerntaak.kwalificatieprofielId,
    });

    if (!kwalificatieprofiel) {
      return null;
    }

    // Get onderdelen
    const niveaus = await KSS.Kwalificatieprofiel.listNiveaus();
    let onderdelen: Array<{ id: string; type: "portfolio" | "praktijk" }> = [];

    for (const niveau of niveaus) {
      const profielen = await KSS.Kwalificatieprofiel.listWithOnderdelen({
        niveauId: niveau.id,
      });

      for (const profiel of profielen) {
        const foundKerntaak = profiel.kerntaken.find(
          (k) => k.id === kerntaakId,
        );
        if (foundKerntaak) {
          onderdelen = foundKerntaak.onderdelen;
          break;
        }
      }
      if (onderdelen.length > 0) break;
    }

    // Get werkprocessen for this kerntaak
    const werkprocessen = await KSS.Kwalificatieprofiel.listWerkprocessen({
      kerntaakId,
    });

    // Get beoordelingscriteria for each werkproces
    const werkprocessenWithCriteria = await Promise.all(
      werkprocessen.map(async (werkproces) => {
        const criteria = await KSS.Kwalificatieprofiel.listBeoordelingscriteria(
          {
            werkprocesId: werkproces.id,
          },
        );
        return { ...werkproces, beoordelingscriteria: criteria };
      }),
    );

    return {
      id: kerntaak.id,
      titel: kerntaak.titel,
      type: kerntaak.type,
      rang: kerntaak.rang,
      onderdelen,
      kwalificatieprofiel,
      werkprocessen: werkprocessenWithCriteria,
    };
  });
});

// Bulk PVB operations

export const updatePvbStartTimeForMultiple = async ({
  pvbAanvraagIds,
  startDatumTijd,
  reden,
}: {
  pvbAanvraagIds: string[];
  startDatumTijd: string;
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the first PVB aanvraag to retrieve the location
    if (pvbAanvraagIds.length === 0) {
      throw new Error("Geen PVB aanvragen opgegeven");
    }

    // Type assertion after length check
    const nonEmptyPvbAanvraagIds = pvbAanvraagIds as [string, ...string[]];

    const firstAanvraag = await Pvb.Aanvraag.retrieveById({
      id: nonEmptyPvbAanvraagIds[0],
    });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: firstAanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    return await Pvb.Aanvraag.updateStartTimeForMultiple({
      pvbAanvraagIds: nonEmptyPvbAanvraagIds,
      startDatumTijd,
      aangemaaktDoor: locationAdminActor.id,
      reden: reden || "Aanvangsdatum/tijd aangepast via locatiebeheer",
    });
  });
};

export const updatePvbLeercoachForMultiple = async ({
  pvbAanvraagIds,
  leercoachId,
  reden,
}: {
  pvbAanvraagIds: string[];
  leercoachId: string;
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the first PVB aanvraag to retrieve the location
    if (pvbAanvraagIds.length === 0) {
      throw new Error("Geen PVB aanvragen opgegeven");
    }

    // Type assertion after length check
    const nonEmptyPvbAanvraagIds = pvbAanvraagIds as [string, ...string[]];

    const firstAanvraag = await Pvb.Aanvraag.retrieveById({
      id: nonEmptyPvbAanvraagIds[0],
    });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: firstAanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    return await Pvb.Aanvraag.updateLeercoachForMultiple({
      pvbAanvraagIds: nonEmptyPvbAanvraagIds,
      leercoachId,
      aangemaaktDoor: locationAdminActor.id,
      reden: reden || "Leercoach toegewezen via locatiebeheer",
    });
  });
};

export const updatePvbBeoordelaarForMultiple = async ({
  pvbAanvraagIds,
  beoordelaarId,
  reden,
}: {
  pvbAanvraagIds: string[];
  beoordelaarId: string;
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the first PVB aanvraag to retrieve the location
    if (pvbAanvraagIds.length === 0) {
      throw new Error("Geen PVB aanvragen opgegeven");
    }

    // Type assertion after length check
    const nonEmptyPvbAanvraagIds = pvbAanvraagIds as [string, ...string[]];

    const firstAanvraag = await Pvb.Aanvraag.retrieveById({
      id: nonEmptyPvbAanvraagIds[0],
    });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: firstAanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    return await Pvb.Aanvraag.updateBeoordelaarForMultiple({
      pvbAanvraagIds: nonEmptyPvbAanvraagIds,
      beoordelaarId,
      aangemaaktDoor: locationAdminActor.id,
      reden: reden || "Beoordelaar toegewezen via locatiebeheer",
    });
  });
};

export const cancelPvbsForMultiple = async ({
  pvbAanvraagIds,
  reden,
}: {
  pvbAanvraagIds: string[];
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the first PVB aanvraag to retrieve the location
    if (pvbAanvraagIds.length === 0) {
      throw new Error("Geen PVB aanvragen opgegeven");
    }

    // Type assertion after length check
    const nonEmptyPvbAanvraagIds = pvbAanvraagIds as [string, ...string[]];

    const firstAanvraag = await Pvb.Aanvraag.retrieveById({
      id: nonEmptyPvbAanvraagIds[0],
    });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: firstAanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    return await Pvb.Aanvraag.cancelMultiple({
      pvbAanvraagIds: nonEmptyPvbAanvraagIds,
      aangemaaktDoor: locationAdminActor.id,
      reden: reden || "Aanvraag geannuleerd via locatiebeheer",
    });
  });
};

export const submitPvbsForMultiple = async ({
  pvbAanvraagIds,
  reden,
}: {
  pvbAanvraagIds: string[];
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the first PVB aanvraag to retrieve the location
    if (pvbAanvraagIds.length === 0) {
      throw new Error("Geen PVB aanvragen opgegeven");
    }

    // Type assertion after length check
    const nonEmptyPvbAanvraagIds = pvbAanvraagIds as [string, ...string[]];

    const firstAanvraag = await Pvb.Aanvraag.retrieveById({
      id: nonEmptyPvbAanvraagIds[0],
    });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: firstAanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    return await Pvb.Aanvraag.submitMultiple({
      pvbAanvraagIds: nonEmptyPvbAanvraagIds,
      aangemaaktDoor: locationAdminActor.id,
      reden: reden || "Aanvraag ingediend via locatiebeheer",
    });
  });
};

export const grantPvbLeercoachPermissionForMultiple = async ({
  pvbAanvraagIds,
  reden,
}: {
  pvbAanvraagIds: string[];
  reden?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the first PVB aanvraag to retrieve the location
    if (pvbAanvraagIds.length === 0) {
      throw new Error("Geen PVB aanvragen opgegeven");
    }

    // Type assertion after length check
    const nonEmptyPvbAanvraagIds = pvbAanvraagIds as [string, ...string[]];

    const firstAanvraag = await Pvb.Aanvraag.retrieveById({
      id: nonEmptyPvbAanvraagIds[0],
    });

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId: firstAanvraag.locatie.id,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    return await Pvb.Aanvraag.grantLeercoachPermissionForMultiple({
      pvbAanvraagIds: nonEmptyPvbAanvraagIds.map((id) => ({
        id,
        aangemaaktDoor: locationAdminActor.id,
      })) as [
        { id: string; aangemaaktDoor: string },
        ...{ id: string; aangemaaktDoor: string }[],
      ],
      reden:
        reden || "Toestemming gegeven door locatiebeheerder namens leercoach",
    });
  });
};

export const createBulkPvbs = async ({
  locationId,
  kandidaten,
  kwalificatieprofielen,
  selectedOnderdelen,
  opmerkingen,
}: {
  locationId: string;
  kandidaten: Array<{
    id: string;
    leercoach?: string;
    beoordelaar?: string;
    startDatumTijd?: string | null;
  }>;
  kwalificatieprofielen: Array<{
    id: string;
    titel: string;
    richting: string;
    hoofdcursus?: { courseId: string };
    aanvullendeCursussen: Array<{ courseId: string }>;
    instructieGroepId: string | null;
  }>;
  selectedOnderdelen: string[];
  opmerkingen?: string;
}) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    // Get the location_admin actor for this person at this location
    const locationAdminActor = await Location.Person.getActorByPersonIdAndType({
      locationId,
      actorType: "location_admin",
      personId: primaryPerson.id,
    });

    if (!locationAdminActor) {
      throw new Error("Aanvrager is geen locatiebeheerder");
    }

    // Validation
    if (kandidaten.length === 0) {
      throw new Error("Selecteer minimaal één kandidaat");
    }

    if (!kwalificatieprofielen.some((kp) => kp.hoofdcursus)) {
      throw new Error("Selecteer minimaal één hoofdcursus");
    }

    if (!selectedOnderdelen || selectedOnderdelen.length === 0) {
      throw new Error("Selecteer minimaal één onderdeel");
    }

    const results = [];

    // Create PvB aanvraag for each kandidaat
    for (const kandidaat of kandidaten) {
      try {
        // Collect all courses
        const allCourses: Array<{
          courseId: string;
          instructieGroepId: string;
          isMainCourse: boolean;
          opmerkingen: string | null;
        }> = [];

        // Process kwalificatieprofielen and their courses
        for (const kp of kwalificatieprofielen) {
          if (kp.hoofdcursus && kp.instructieGroepId) {
            allCourses.push({
              courseId: kp.hoofdcursus.courseId,
              instructieGroepId: kp.instructieGroepId,
              isMainCourse: true,
              opmerkingen: null,
            });
          }

          for (const aanvullendeCursus of kp.aanvullendeCursussen) {
            if (kp.instructieGroepId) {
              allCourses.push({
                courseId: aanvullendeCursus.courseId,
                instructieGroepId: kp.instructieGroepId,
                isMainCourse: false,
                opmerkingen: null,
              });
            }
          }
        }

        // Validate that we have at least one course
        if (allCourses.length === 0) {
          throw new Error(
            "Geen geldige cursussen gevonden. Zorg ervoor dat alle hoofdcursussen zijn geselecteerd.",
          );
        }

        // Ensure at least one course is marked as main
        if (!allCourses.some((c) => c.isMainCourse)) {
          const firstCourse = allCourses[0];
          if (firstCourse) {
            firstCourse.isMainCourse = true;
          }
        }

        const aanvraagInput = {
          type: "intern" as const,
          aangevraagdDoor: locationAdminActor.id,
          locatieId: locationId,
          kandidaatId: kandidaat.id,
          leercoachId: kandidaat.leercoach || null,
          opmerkingen: opmerkingen || null,
          startDatumTijd: kandidaat.startDatumTijd || null,
          courses: allCourses as [
            {
              courseId: string;
              instructieGroepId: string;
              isMainCourse: boolean;
              opmerkingen: string | null;
            },
            ...{
              courseId: string;
              instructieGroepId: string;
              isMainCourse: boolean;
              opmerkingen: string | null;
            }[],
          ],
          onderdelen: selectedOnderdelen.map((onderdeelId: string) => ({
            kerntaakOnderdeelId: onderdeelId,
            beoordelaarId: kandidaat.beoordelaar || null,
            opmerkingen: null,
          })) as [
            {
              kerntaakOnderdeelId: string;
              beoordelaarId: string | null;
              opmerkingen: string | null;
            },
            ...{
              kerntaakOnderdeelId: string;
              beoordelaarId: string | null;
              opmerkingen: string | null;
            }[],
          ],
        };

        const result = await Pvb.Aanvraag.createAanvraag(aanvraagInput);

        results.push({
          kandidaatId: kandidaat.id,
          success: true,
          aanvraagId: result.id,
        });
      } catch (error) {
        results.push({
          kandidaatId: kandidaat.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      message: `${successCount} PvB aanvragen succesvol aangemaakt${failureCount > 0 ? `, ${failureCount} gefaald` : ""}`,
      results,
      successCount,
      failureCount,
    };
  });
};
