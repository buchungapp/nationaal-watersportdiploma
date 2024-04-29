import {
  Certificate,
  Program,
  withDatabase,
  withSupabaseClient,
} from "@nawadi/core";
import { notFound } from "next/navigation";

export async function findCertificate({
  handle,
  issuedAt,
}: {
  handle: string;
  issuedAt: string;
}) {
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
}

export async function listDisciplines() {
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
}
