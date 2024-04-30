import {
  Certificate,
  Curriculum,
  Program,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import { notFound } from "next/navigation";
import { cache } from "react";

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
