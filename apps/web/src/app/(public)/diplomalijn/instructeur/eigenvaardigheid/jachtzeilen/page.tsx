import {
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "~/app/(public)/_components/breadcrumb";
import {
  listCourses,
  listProgramsForCourse,
  retrieveDisciplineByHandle,
} from "~/lib/nwd";
import { InfoCard } from "../../_components/info-card";
import { EIGENVAARDIGHEID_DISCIPLINES } from "../../_data/eigenvaardigheid-disciplines";
import {
  JACHTZEILEN_EV_BASE,
  JACHTZEILEN_EV_HANDLE,
  sortJachtzeilenCourses,
} from "../../_data/jachtzeilen-ev";

export const metadata: Metadata = {
  title: "Eigenvaardigheid Jachtzeilen",
  description: "NWD A, B en C per vaarwater voor instructeurs jachtzeilen",
};

const EV_RANG = { a: 5, b: 6, c: 7 } as const;

function levelChips(levels: { a: boolean; b: boolean; c: boolean }) {
  const chips: Array<{ label: string; className: string }> = [];
  if (levels.a)
    chips.push({
      label: "NWD A",
      className: "bg-branding-light/15 text-branding-dark",
    });
  if (levels.b)
    chips.push({
      label: "NWD B",
      className: "bg-branding-light/20 text-branding-dark",
    });
  if (levels.c)
    chips.push({
      label: "NWD C",
      className: "bg-branding-dark/15 text-branding-dark",
    });
  return chips;
}

export default async function Page() {
  const dbDiscipline = await retrieveDisciplineByHandle(JACHTZEILEN_EV_HANDLE);
  const staticDiscipline = EIGENVAARDIGHEID_DISCIPLINES.find(
    (d) => d.handle === JACHTZEILEN_EV_HANDLE,
  );

  if (!dbDiscipline && !staticDiscipline) {
    notFound();
  }

  const disciplineTitle =
    dbDiscipline?.title ?? staticDiscipline?.title ?? "Jachtzeilen";

  const allInstructeurCourses = dbDiscipline
    ? await listCourses("instructeur")
    : [];
  const instructeurCourses = dbDiscipline
    ? sortJachtzeilenCourses(
        allInstructeurCourses.filter(
          (c) => c.discipline.id === dbDiscipline.id,
        ),
      )
    : [];

  const coursesWithLevels = await Promise.all(
    instructeurCourses.map(async (course) => {
      const programs = await listProgramsForCourse(course.id);
      const levels = { a: false, b: false, c: false };
      for (const program of programs) {
        const { rang } = program.degree;
        if (rang === EV_RANG.a) levels.a = true;
        if (rang === EV_RANG.b) levels.b = true;
        if (rang === EV_RANG.c) levels.c = true;
      }
      return { course, levels };
    }),
  );

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: "Eigenvaardigheid",
            href: "/diplomalijn/instructeur/eigenvaardigheid",
          },
          {
            label: disciplineTitle,
            href: JACHTZEILEN_EV_BASE,
          },
        ]}
      />

      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        Eigenvaardigheid {disciplineTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Bij jachtzeilen hangt de eigenvaardigheidslijn af van het vaarwater
        waarin je lesgeeft. Kies hieronder het vaarwater om NWD A, B en C te
        bekijken.
      </p>

      {instructeurCourses.length > 0 ? (
        <ul className="mt-8 list-none pl-0">
          {coursesWithLevels.map(({ course, levels }) => {
            const chips = levelChips(levels);
            return (
              <li key={course.id} className="border-t border-slate-200 pl-0">
                <Link
                  href={`${JACHTZEILEN_EV_BASE}/${course.handle}`}
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-branding-dark"
                >
                  <div className="min-w-0">
                    <h2 className="my-0 text-lg/6 font-semibold text-slate-900">
                      {course.title}
                    </h2>
                    {chips.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {chips.map((chip) => (
                          <span
                            key={chip.label}
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${chip.className}`}
                          >
                            {chip.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-slate-400">
                        Nog geen programma&apos;s gepubliceerd
                      </p>
                    )}
                  </div>
                  <ChevronRightIcon className="size-6 shrink-0 text-slate-900" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8">
          <InfoCard
            tone="instructeur"
            icon={<ClipboardDocumentCheckIcon className="size-5" />}
            title="Vaarwateren nog niet gepubliceerd"
          >
            <p>
              De eigenvaardigheidsprogramma&apos;s per vaarwater worden op dit
              moment ingericht. Zodra ze beschikbaar zijn verschijnen ze
              automatisch op deze pagina.
            </p>
          </InfoCard>
        </div>
      )}

      <div className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-lg/6 font-semibold text-slate-900">
          Vaarwateren voor jachtzeilen
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Op onderstaande kaart zie je de verschillende vaarwateren voor
          jachtzeilen. De Hollandse kuststrook en de grote Zeeuwse meren kunnen
          gebruikt worden voor twee verschillende diplomalijnen.
        </p>
        <Image
          src={
            (
              await import(
                "../../../consument/_assets/vaarwateren-jachtzeilen.png"
              )
            ).default
          }
          alt="Vaarwateren jachtzeilen"
          className="mt-6"
        />
      </div>
    </div>
  );
}
