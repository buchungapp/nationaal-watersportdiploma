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
import { cache } from "react";
import "server-only";

export const getUser = cache(async () => {
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

  const userData = await User.fromId(authUser.id);

  if (!userData) {
    throw new Error("User not found");
  }

  return userData;
});

export const findCertificate = async ({
  handle,
  issuedAt,
}: {
  handle: string;
  issuedAt: string;
}) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const certificate = await Certificate.find({
            handle,
            issuedAt,
          });

          if (!certificate) {
            notFound();
          }

          return certificate;
        },
      ),
  );
};

export const listCertificatesByLocationId = cache(
  async (locationId: string) => {
    return withSupabaseClient(
      {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      () =>
        withDatabase(
          { pgUri: process.env.PGURI!, serverless: true },
          async () => {
            await getUser();

            const certificates = await Certificate.list({
              filter: { locationId },
            });

            return certificates;
          },
        ),
    );
  },
);

export const listCertificatesByNumber = cache(async (numbers: string[]) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          await getUser();

          const certificates = await Certificate.list({
            filter: { number: numbers },
          });

          return certificates;
        },
      ),
  );
});

export const retrieveCertificateById = cache(async (id: string) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const certificate = await Certificate.byId(id);

          if (!certificate) {
            notFound();
          }

          return certificate;
        },
      ),
  );
});

export const listDisciplines = cache(async () => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const disciplines = await Program.Discipline.list();

          return disciplines;
        },
      ),
  );
});

export const listCountries = cache(async () => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const disciplines = await Platform.Country.list();

          return disciplines;
        },
      ),
  );
});

export const retrieveDisciplineByHandle = cache(async (handle: string) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const disciplines = await Program.Discipline.fromHandle(handle);

          return disciplines;
        },
      ),
  );
});

export const listPrograms = cache(async () => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const disciplines = await Program.list();

          return disciplines;
        },
      ),
  );
});

export const listCurriculaByDiscipline = cache(async (disciplineId: string) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const disciplines = await Curriculum.list({
            filter: { onlyCurrentActive: true, disciplineId },
          });

          return disciplines;
        },
      ),
  );
});

export const listCurriculaByProgram = cache(async (programId: string) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const disciplines = await Curriculum.list({
            filter: { onlyCurrentActive: true, programId },
          });

          return disciplines;
        },
      ),
  );
});

export const listGearTypesByCurriculum = cache(async (curriculumId: string) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const gearTypes = await Curriculum.GearType.list({
            filter: {
              curriculumId: curriculumId,
            },
          });

          return gearTypes;
        },
      ),
  );
});

export const retrieveLocationByHandle = cache(async (handle: string) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          await getUser();

          const location = await Location.fromHandle(handle);

          return location;
        },
      ),
  );
});

export const listPersonsForLocation = cache(async (locationId: string) => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          await getUser();

          const persons = await User.Person.list({ filter: { locationId } });

          return persons;
        },
      ),
  );
});

export const createPersonForLocation = cache(
  async (
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
    return withSupabaseClient(
      {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      () =>
        withDatabase(
          { pgUri: process.env.PGURI!, serverless: true },
          async () => {
            await getUser();

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
          },
        ),
    );
  },
);

export const createCompletedCertificate = cache(
  async (
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
    return withSupabaseClient(
      {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      () =>
        withDatabase(
          { pgUri: process.env.PGURI!, serverless: true },
          async () => {
            return withTransaction(async () => {
              await getUser();

              // Start student curriculum
              const { id: studentCurriculumId } =
                await Student.Program.startProgram({
                  curriculumId,
                  personId,
                  gearTypeId,
                });

              // Start certificate
              const { id: certificateId } =
                await Student.Certificate.startCertificate({
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
          },
        ),
    );
  },
);
