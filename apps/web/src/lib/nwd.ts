import {
  Certificate,
  Curriculum,
  Location,
  Platform,
  Program,
  Student,
  User,
  withDatabase,
  withSupabaseClient,
  withTransaction,
} from "@nawadi/core";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import assert from "node:assert";
import { cache } from "react";
import "server-only";

function extractPerson(user: Awaited<ReturnType<typeof getUserOrThrow>>) {
  assert.strictEqual(user.persons.length, 1, "Expected exactly one person");

  return user.persons[0]!;
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
        get(name: string) {
          return cookieStore.get(name)?.value;
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
    const [userData, persons] = await Promise.all([
      User.fromId(authUser.id),
      User.Person.list({ filter: { userId: authUser.id } }),
    ]);

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

    const person = extractPerson(user);

    const availableLocations = await User.Person.listLocations({
      personId: person.id,
      roles: ["location_admin"],
    });

    if (!availableLocations.some((l) => l.locationId === locationId)) {
      throw new Error("Location not found for person");
    }

    const certificates = await Certificate.list({
      filter: { locationId },
    });

    return certificates;
  });
});

export const listCertificatesByNumber = cache(async (numbers: string[]) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    const person = extractPerson(user);

    const availableLocations = await User.Person.listLocations({
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
    const disciplines = await Program.Discipline.list();

    return disciplines;
  });
});

export const listCountries = cache(async () => {
  return makeRequest(async () => {
    const disciplines = await Platform.Country.list();

    return disciplines;
  });
});

export const retrieveDisciplineByHandle = cache(async (handle: string) => {
  return makeRequest(async () => {
    const disciplines = await Program.Discipline.fromHandle(handle);

    return disciplines;
  });
});

export const listPrograms = cache(async () => {
  return makeRequest(async () => {
    const disciplines = await Program.list();

    return disciplines;
  });
});

export const listCurriculaByDiscipline = cache(async (disciplineId: string) => {
  return makeRequest(async () => {
    const disciplines = await Curriculum.list({
      filter: { onlyCurrentActive: true, disciplineId },
    });

    return disciplines;
  });
});

export const listCurriculaByProgram = cache(async (programId: string) => {
  return makeRequest(async () => {
    const disciplines = await Curriculum.list({
      filter: { onlyCurrentActive: true, programId },
    });

    return disciplines;
  });
});

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
    const user = await getUserOrThrow();

    const person = extractPerson(user);

    const availableLocations = await User.Person.listLocations({
      personId: person.id,
      roles: ["location_admin"],
    });

    const location = await Location.fromHandle(handle);

    if (!availableLocations.some((l) => l.locationId === location.id)) {
      throw new Error("Location not found for person");
    }

    return location;
  });
});

export const listPersonsForLocation = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    const person = extractPerson(user);

    const availableLocations = await User.Person.listLocations({
      personId: person.id,
      roles: ["location_admin"],
    });

    if (!availableLocations.some((l) => l.locationId === locationId)) {
      throw new Error("Location not found for person");
    }

    const persons = await User.Person.list({ filter: { locationId } });

    return persons;
  });
});

export const createPersonForLocation = async (
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

    const authPerson = extractPerson(authUser);

    const availableLocations = await User.Person.listLocations({
      personId: authPerson.id,
      roles: ["location_admin"],
    });

    if (!availableLocations.some((l) => l.locationId === locationId)) {
      throw new Error("Location not found for person");
    }

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

      const authPerson = extractPerson(authUser);

      const availableLocations = await User.Person.listLocations({
        personId: authPerson.id,
        roles: ["location_admin"],
      });

      if (!availableLocations.some((l) => l.locationId === locationId)) {
        throw new Error("Location not found for person");
      }

      // Start student curriculum
      const { id: studentCurriculumId } = await Student.Program.startProgram({
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

      return { id: certificateId };
    });
  });
};
