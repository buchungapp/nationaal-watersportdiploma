import {
  Certificate,
  Cohort,
  Course,
  Curriculum,
  Location,
  Platform,
  Student,
  User,
  withDatabase,
  withSupabaseClient,
  withTransaction,
} from "@nawadi/core";
import slugify from "@sindresorhus/slugify";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import "server-only";
import packageInfo from "~/../package.json";
import posthog from "./posthog";

export type ActorType = "student" | "instructor" | "location_admin";

async function getPrimaryPerson<T extends boolean = true>(
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
    user.persons.find((person) => person.isPrimary) ?? user.persons[0]!;

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

async function isActiveActorTypeInLocation({
  actorType,
  locationId,
  personId,
}: {
  personId: string;
  locationId: string;
  actorType: ActorType[];
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
    return withSupabaseClient(
      {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      () => withDatabase({ pgUri: process.env.PGURI!, serverless: true }, cb),
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const getUserOrThrow = cache(async () => {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const userData = await User.fromId(authUser.id);
    // We can't run this in parallel, because fromId will create the user if it doesn't exist
    const persons = await User.Person.list({ filter: { userId: authUser.id } });

    if (!userData) {
      throw new Error("User not found");
    }

    return {
      ...userData,
      persons,
    };
  });
});

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

    return certificates;
  });
});

export const listCertificatesByNumber = cache(async (numbers: string[]) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    const availableLocations = await User.Person.listLocationsByRole({
      personId: person.id,
      roles: ["location_admin"],
    });

    const certificates = await Certificate.list({
      filter: {
        number: numbers,
        locationId: availableLocations.map((l) => l.locationId),
      },
    });

    return certificates;
  });
});

export const retrieveCertificateById = cache(async (id: string) => {
  return makeRequest(async () => {
    const certificate = await Certificate.byId(id);

    if (!certificate) {
      notFound();
    }

    return certificate;
  });
});

export const listDisciplines = cache(async () => {
  return makeRequest(async () => {
    const disciplines = await Course.Discipline.list();

    return disciplines;
  });
});

export const listDegrees = cache(async () => {
  return makeRequest(async () => {
    const degrees = await Course.Degree.list();

    return degrees;
  });
});

export const listModules = cache(async () => {
  return makeRequest(async () => {
    const modules = await Course.Module.list();

    return modules;
  });
});

export const listCompetencies = cache(async () => {
  return makeRequest(async () => {
    const competencies = await Course.Competency.list();

    return competencies;
  });
});

export const listGearTypes = cache(async () => {
  return makeRequest(async () => {
    const gearTypes = await Curriculum.GearType.list();

    return gearTypes;
  });
});

export const listCategories = cache(async () => {
  return makeRequest(async () => {
    const categories = await Course.Category.list();

    return categories;
  });
});

export const listParentCategories = cache(async () => {
  return makeRequest(async () => {
    const categories = await Course.Category.listParentCategories();

    return categories;
  });
});

export const listCountries = cache(async () => {
  return makeRequest(async () => {
    const countries = await Platform.Country.list();

    return countries;
  });
});

export const retrieveDisciplineByHandle = cache(async (handle: string) => {
  return makeRequest(async () => {
    const disciplines = await Course.Discipline.fromHandle(handle);

    return disciplines;
  });
});

export const listCourses = cache(async () => {
  return makeRequest(async () => {
    const courses = await Course.list();

    return courses;
  });
});

export const retrieveCourseByHandle = cache(async (handle: string) => {
  return makeRequest(async () => {
    const courses = await Course.list();

    return courses.find((course) => course.handle === handle);
  });
});

export const listPrograms = cache(async () => {
  return makeRequest(async () => {
    const programs = await Course.Program.list();

    return programs;
  });
});

export const listProgramsForCourse = cache(async (courseId: string) => {
  return makeRequest(async () => {
    const programs = await Course.Program.list({ filter: { courseId } });

    return programs;
  });
});

export const listCurriculaByDiscipline = cache(async (disciplineId: string) => {
  return makeRequest(async () => {
    const curricula = await Curriculum.list({
      filter: { onlyCurrentActive: true, disciplineId },
    });

    return curricula;
  });
});

export const listCurriculaByProgram = cache(
  async (programId: string, onlyCurrentActive = true) => {
    return makeRequest(async () => {
      const curricula = await Curriculum.list({
        filter: { onlyCurrentActive, programId },
      });

      return curricula;
    });
  },
);

export const retrieveCurriculumById = cache(async (id: string) => {
  return makeRequest(async () => {
    return await Curriculum.getById({ id });
  });
});

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

export const copyCurriculum = async ({
  curriculumId,
  revision,
}: {
  curriculumId: string;
  revision?: string;
}) => {
  return makeRequest(async () => {
    return Curriculum.copy({
      curriculumId,
      revision: revision ?? `Copy of ${new Date().toISOString()}`,
    });
  });
};

export const listGearTypesByCurriculum = cache(async (curriculumId: string) => {
  return makeRequest(async () => {
    const gearTypes = await Curriculum.GearType.list({
      filter: {
        curriculumId: curriculumId,
      },
    });

    return gearTypes;
  });
});

export const retrieveLocationByHandle = cache(async (handle: string) => {
  return makeRequest(async () => {
    return await Location.fromHandle(handle);
  });
});

export const listPersonsForLocation = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: person.id,
    }).catch(() => []);

    const persons = await User.Person.list({ filter: { locationId } });

    return persons;
  });
});

export const getPersonById = cache(
  async (personId: string, locationId: string) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const primaryPerson = await getPrimaryPerson(user);

      await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: primaryPerson.id,
      }).catch(() => []);

      const person = await User.Person.byIdOrHandle({ id: personId });
      return person;
    });
  },
);

export const listPersonsForUser = cache(async () => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    const persons = await User.Person.list({
      filter: { userId: user.authUserId },
    });

    return persons;
  });
});

export const listPersonsForLocationByRole = cache(
  async (locationId: string, role: ActorType) => {
    return makeRequest(async () => {
      const user = await getUserOrThrow();
      const person = await getPrimaryPerson(user);

      await isActiveActorTypeInLocation({
        actorType: ["location_admin"],
        locationId,
        personId: person.id,
      }).catch(() => []);

      const persons = await Location.Person.list({
        locationId,
        filter: { type: role },
      });

      return persons;
    });
  },
);

export const listLocationsForPerson = cache(async (personId?: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();
    const person = await getPrimaryPerson(user);

    if (personId && person.id !== personId) {
      throw new Error("Unauthorized");
    }

    const locations = await User.Person.listLocationsByRole({
      personId: person.id,
    });

    return await Location.list().then((locs) =>
      locs.filter((l) => locations.some((loc) => loc.locationId === l.id)),
    );
  });
});

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
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId,
      personId: primaryPerson.id,
    });

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
            (c) => c.id === allocation.studentCurriculum!.curriculumId,
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

      return result;
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

      await Promise.all(certificateIds.map(Certificate.withdraw));

      return;
    });
  });
};

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
          cohort.accessStartTime <= new Date().toISOString() &&
          cohort.accessEndTime >= new Date().toISOString());

      if (!canAccessCohort) {
        return null;
      }

      return cohort;
    });
  },
);

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

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "whatsapp"
  | "x"
  | "youtube";

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
  async (allocationId: string) => {
    return makeRequest(async () => {
      // TODO: This needs authorization checks

      return await Cohort.StudentProgress.byAllocationId({ id: allocationId });
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

    // TODO: add check if it really is a student, not an instructor
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

      if (!!personId) {
        await isActiveActorTypeInLocation({
          actorType: ["location_admin"],
          locationId,
          personId: primaryPerson.id,
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
      action === "claim" ? instructorPersonId ?? primaryPerson.id : null;

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
  allocationId: string;
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
  type: ActorType;
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
  type: ActorType;
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
  locationId: string;
}) {
  return makeRequest(async () => {
    const [primaryPerson] = await Promise.all([
      getUserOrThrow().then(getPrimaryPerson),
    ]);

    await listRolesForLocation(locationId, personId).then((roles) => {
      if (roles.length < 1) {
        throw new Error("Unauthorized");
      }
    });

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: locationId,
      personId: primaryPerson.id,
    });

    return await User.Person.moveToAccountByEmail({
      email,
      personId,
    });
  });
}

export const listKnowledgeCenterDocuments = cache(async () => {
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

    return await Platform.Media.listFiles();
  });
});

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
  locationId: string;
  firstName?: string;
  lastNamePrefix?: string | null;
  lastName?: string;
  dateOfBirth?: Date;
  birthCity?: string;
  birthCountry?: string;
}) => {
  return makeRequest(async () => {
    const [primaryPerson, person] = await Promise.all([
      getUserOrThrow().then(getPrimaryPerson),
      User.Person.byIdOrHandle({ id: personId }),
    ]);

    if (!person) {
      throw new Error("Person not found");
    }

    await isActiveActorTypeInLocation({
      actorType: ["location_admin"],
      locationId: locationId,
      personId: primaryPerson.id,
    });

    const associatedToLocation = await User.Person.listActiveRolesForLocation({
      locationId,
      personId,
    }).then((roles) => roles.length > 0);

    if (!associatedToLocation) {
      throw new Error("Unauthorized");
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
