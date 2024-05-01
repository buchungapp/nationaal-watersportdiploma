import {
  Certificate,
  Curriculum,
  Location,
  Program,
  User,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

async function tmpAuthCheck() {
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

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    redirect("/login");
  }

  if (data.user.id !== "d9dd30ea-1ebb-4e56-aa24-25cd9a38692e") {
    throw new Error("Unauthorized");
  }

  return data.user;
}

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
          await tmpAuthCheck();

          const location = await Location.fromHandle(handle);

          return location;
        },
      ),
  );
});

export const retrieveUser = cache(async () => {
  return withSupabaseClient(
    {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    () =>
      withDatabase(
        { pgUri: process.env.PGURI!, serverless: true },
        async () => {
          const authUser = await tmpAuthCheck();

          const user = await User.fromId(authUser.id);

          if (!user) {
            throw new Error("User not found");
          }

          return user;
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
          await tmpAuthCheck();

          const persons = await User.Person.list({ filters: { locationId } });

          return persons;
        },
      ),
  );
});
