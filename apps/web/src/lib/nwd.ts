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
import { isPersonInCohortById } from "../../../../packages/core/out/models/cohort/allocation";
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
    });

    const persons = await User.Person.list({ filter: { locationId } });

    return persons;
  });
});

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
      });

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

export const listCohortsForLocation = cache(async (locationId: string) => {
  return makeRequest(async () => {
    // TODO: This needs authorization checks

    const cohorts = await Cohort.listByLocationId({ id: locationId });

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
        isPersonInCohortById({
          cohortId: cohort.id,
          personId: primaryPerson.id,
          actorType: "instructor",
        }),
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
      // TODO: This needs authorization checks
      return await Cohort.listStudentsWithCurricula({ cohortId });
    });
  },
);

export const retrieveStudentAllocationWithCurriculum = cache(
  async (cohortId: string, allocationId: string) => {
    return makeRequest(async () => {
      // TODO: This needs authorization checks

      return await Cohort.retrieveStudentWithCurriculum({
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

export const updateCompetencyProgress = cache(
  async ({
    cohortAllocationId,
    competencyProgress,
  }: {
    cohortAllocationId: string;
    competencyProgress: {
      competencyId: string;
      progress: number;
    }[];
  }) => {
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
  },
);

export async function addStudentToCohortByPersonId({
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
    const _primaryPerson = await getPrimaryPerson(authUser);

    // TODO: Update authorization
    // await isActiveActorTypeInLocation({
    //   actorType: ["location_admin"],
    //   locationId: id,
    //   personId: primaryPerson.id,
    // });

    const actor = await Location.Person.getActorByPersonIdAndType({
      locationId,
      actorType: "student",
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

export const isInstructorInCohort = cache(async (cohortId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    return await Cohort.Allocation.isPersonInCohortById({
      cohortId,
      personId: primaryPerson.id,
      actorType: "instructor",
    });
  });
});

export const listRolesForLocation = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const authUser = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(authUser);

    return await User.Person.listActiveRolesForLocation({
      locationId,
      personId: primaryPerson.id,
    });
  });
});

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

export async function claimStudentsInCohort(
  cohortId: string,
  studentAllocationIds: string[],
) {
  return makeRequest(async () => {
    const [authUser, cohort] = await Promise.all([
      getUserOrThrow(),
      Cohort.byIdOrHandle({ id: cohortId }).then(
        (cohort) => cohort ?? notFound(),
      ),
    ]);

    const primaryPerson = await getPrimaryPerson(authUser);

    const instructorActor = await Location.Person.getActorByPersonIdAndType({
      locationId: cohort.locationId,
      actorType: "instructor",
      personId: primaryPerson.id,
    });

    if (!instructorActor) {
      throw new Error("Instructor not found for location");
    }

    return await Cohort.Allocation.setInstructorForStudent({
      cohortId,
      instructorId: instructorActor.id,
      studentAllocationId: studentAllocationIds,
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
