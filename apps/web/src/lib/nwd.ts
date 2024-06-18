import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import assert from "node:assert";
import { cache } from "react";
import "server-only";
import posthog from "./posthog";

const baseUrl = new URL(process.env.NAWADI_API_URL!);
const apiKey = String(process.env.NAWADI_API_KEY!);

function extractPerson(user: Awaited<ReturnType<typeof getUserOrThrow>>) {
  assert(user.persons.length <= 1, "Expected at most one person per user");

  return user.persons[0] ?? null;
}

async function makeRequest<T>(cb: () => Promise<T>) {
  try {
    return core.withSupabaseClient(
      {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      () =>
        core.withDatabase({ pgUri: process.env.PGURI!, serverless: true }, cb),
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
    const userData = await core.User.fromId(authUser.id);
    // We can't run this in parallel, because fromId will create the user if it doesn't exist
    const persons = await core.User.Person.list({
      filter: { userId: authUser.id },
    });

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
  const result = await api.findCertificate(
    {
      parameters: { certificateHandle: handle, issuedAt },
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
};

export const listCertificates = cache(async (locationId: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    const person = extractPerson(user);

    if (!person) return [];

    const availableLocations = await core.User.Person.listLocations({
      personId: person.id,
      roles: ["location_admin"],
    });

    if (!availableLocations.some((l) => l.locationId === locationId)) {
      throw new Error("Location not found for person");
    }

    const certificates = await core.Certificate.list({
      filter: { locationId },
    });

    return certificates;
  });
});

export const listCertificatesByNumber = cache(async (numbers: string[]) => {
  const result = await api.listCertificatesByNumber(
    {
      parameters: {
        numbers,
      },
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const retrieveCertificateById = cache(async (id: string) => {});

export const listDisciplines = cache(async () => {
  const result = await api.listDisciplines(
    {
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const listCountries = cache(async () => {
  const result = await api.listCountries(
    {
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const retrieveDisciplineByHandle = cache(async (handle: string) => {
  const result = await api.retrieveDiscipline(
    {
      parameters: {
        disciplineKey: handle,
      },
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const listPrograms = cache(async () => {
  const result = await api.listPrograms(
    {
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const listCurriculaByDiscipline = cache(async (disciplineId: string) => {
  const result = await api.listCurriculaByDiscipline(
    {
      parameters: {
        disciplineKey: disciplineId,
      },
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const listCurriculaByProgram = cache(async (programId: string) => {
  const result = await api.listCurriculaByProgram(
    {
      parameters: {
        programKey: programId,
      },
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const listGearTypesByCurriculum = cache(async (curriculumId: string) => {
  const result = await api.listGearTypesByCurriculum(
    {
      parameters: {
        curriculumKey: curriculumId,
      },
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const retrieveLocationByHandle = cache(async (handle: string) => {
  const result = await api.getLocation(
    {
      parameters: {
        locationKey: handle,
      },
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const listPersonsForLocation = cache(async (locationId: string) => {
  const result = await api.listPersonsForLocation(
    {
      parameters: {
        locationKey: locationId,
      },
      contentType: null,
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 200, 404);

  switch (result.status) {
    case 200: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
});

export const listLocationsForPerson = cache(async (personId?: string) => {
  return makeRequest(async () => {
    const user = await getUserOrThrow();

    const person = extractPerson(user);

    if (!person) {
      return [];
    }

    if (personId && person.id !== personId) {
      throw new Error("Person not found for user");
    }

    const locations = await core.User.Person.listLocations({
      personId: person.id,
      roles: ["location_admin"],
    });

    return await core.Location.list().then((locs) =>
      locs.filter((l) => locations.some((loc) => loc.locationId === l.id)),
    );
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
  const result = await api.createPersonForLocation(
    {
      parameters: {
        locationKey: locationId,
      },
      contentType: "application/json",
      entity: () => ({
        email: personInput.email,
        firstName: personInput.firstName,
        lastNamePrefix: personInput.lastNamePrefix ?? undefined,
        lastName: personInput.lastName,
        dateOfBirth: personInput.dateOfBirth.toISOString(),
        birthCity: personInput.birthCity,
        birthCountry: personInput.birthCountry,
      }),
    },
    { apiKey },
    { baseUrl },
  );
  api.lib.expectStatus(result, 201, 404);

  switch (result.status) {
    case 201: {
      const entity = await result.entity();
      return entity;
    }
    case 404:
      notFound();
  }
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
    return core.withTransaction(async () => {
      const authUser = await getUserOrThrow();

      const authPerson = extractPerson(authUser);

      if (!authPerson) {
        throw new Error("Person not found for user");
      }

      const availableLocations = await core.User.Person.listLocations({
        personId: authPerson.id,
        roles: ["location_admin"],
      });

      if (!availableLocations.some((l) => l.locationId === locationId)) {
        throw new Error("Location not found for person");
      }

      // Start student curriculum
      const { id: studentCurriculumId } =
        await core.Student.Program.startProgram({
          curriculumId,
          personId,
          gearTypeId,
        });

      // Start certificate
      const { id: certificateId } =
        await core.Student.Certificate.startCertificate({
          locationId,
          studentCurriculumId,
        });

      // Add completed competencies
      await core.Student.Certificate.completeCompetency({
        certificateId,
        studentCurriculumId,
        competencyId: competencies.flat(),
      });

      // Complete certificate
      await core.Student.Certificate.completeCertificate({
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
