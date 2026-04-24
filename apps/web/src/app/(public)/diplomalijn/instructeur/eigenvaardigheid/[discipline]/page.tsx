import {
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "~/app/(public)/_components/breadcrumb";
import { ModuleOverview } from "~/app/(public)/diplomalijn/_components/module-overview";
import Program from "~/app/(public)/diplomalijn/_components/program";
import {
  listCourses,
  listCurriculaByDiscipline,
  listProgramsForCourse,
  retrieveDisciplineByHandle,
} from "~/lib/nwd";
import { InfoCard } from "../../_components/info-card";

// PROTOTYPE — scaffolded route for instructeur-eigenvaardigheid per discipline.
// Data flow assumes NWD A/B/C land as degree rows (rang 5/6/7) linked via
// programs to an instructeur-type course (handle ending in `-instructeurs`)
// that belongs to this discipline.
//
// Today: DB doesn't have these rows yet, so every discipline page will render
// the empty-state placeholder. When the data lands, the same route renders the
// real Moduleoverzicht + per-NWD-niveau Program disclosures automatically.

export const generateMetadata = async (props: {
  params: Promise<{ discipline: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const discipline = await retrieveDisciplineByHandle(params.discipline);
  if (!discipline) return {};
  return {
    title: `Eigenvaardigheid ${discipline.title}`,
    description: `NWD A, B en C voor ${discipline.title}`,
  };
};

export default async function Page(props: {
  params: Promise<{ discipline: string }>;
}) {
  const { discipline: disciplineHandle } = await props.params;

  const discipline = await retrieveDisciplineByHandle(disciplineHandle);
  if (!discipline) notFound();

  // Find the instructeur-course(s) for this discipline.
  const allCourses = await listCourses("instructeur");
  const instructeurCourses = allCourses.filter(
    (c) => c.discipline.id === discipline.id,
  );

  // Load programs + curricula across the (zero-or-more) instructeur-courses
  // for this discipline, then keep only eigenvaardigheids-programs (rang >= 5).
  const programsPerCourse = await Promise.all(
    instructeurCourses.map((course) => listProgramsForCourse(course.id)),
  );
  const eigenvaardigheidPrograms = programsPerCourse
    .flat()
    .filter((p) => p.degree.rang >= 5)
    .sort((a, b) => a.degree.rang - b.degree.rang);

  const curricula = await listCurriculaByDiscipline(discipline.id);

  const hasData = eigenvaardigheidPrograms.length > 0;
  // When there's data, which course carries it? Use the first one that owns
  // any of the eigenvaardigheid programs — needed for Program component.
  const owningCourse =
    hasData &&
    instructeurCourses.find((c) =>
      eigenvaardigheidPrograms.some((p) => p.courseId === c.id),
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
            label: discipline.title ?? disciplineHandle,
            href: `/diplomalijn/instructeur/eigenvaardigheid/${disciplineHandle}`,
          },
        ]}
      />

      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        Eigenvaardigheid {discipline.title}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        NWD A, B en C voor {discipline.title}. NWD A en B worden via een examen
        vastgesteld bij een erkende opleidingslocatie. NWD C kent geen vaste
        modulestructuur en wordt beoordeeld tijdens een afrondingsweekend door
        twee Instructeurs 5.
      </p>

      {hasData && owningCourse ? (
        <>
          <div className="mt-8">
            <div>
              <h2 className="text-slate-700">Moduleoverzicht</h2>
              <p className="text-sm">
                Per eigenvaardigheidsniveau de modules die aan bod komen, en of
                ze tot de kern behoren of een keuze-onderdeel zijn.
              </p>
            </div>
            <ModuleOverview
              programs={eigenvaardigheidPrograms}
              curricula={curricula}
            />
          </div>

          <div className="mt-12 pb-4">
            <div className="border-t border-slate-300 pt-2">
              <h2 className="text-slate-700">Programmaoverzicht</h2>
              <p className="text-sm">
                Per NWD-niveau de bijbehorende competenties. Als ingelogd actief
                instructeur zie je ook de exacte eisomschrijvingen per
                competentie.
              </p>
            </div>

            <ul className="list-none space-y-6 divide-y divide-zinc-950/5 pl-0">
              {eigenvaardigheidPrograms.map((program) => (
                <Program
                  key={program.id}
                  course={owningCourse}
                  disciplineId={discipline.id}
                  programId={program.id}
                />
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          <InfoCard
            tone="instructeur"
            icon={<ClipboardDocumentCheckIcon className="size-5" />}
            title="Modules en eisomschrijvingen nog niet gepubliceerd"
          >
            <p>
              De modules, competenties en exacte eisomschrijvingen voor NWD A,
              B en C {discipline.title} worden op dit moment ingericht. Zodra
              ze beschikbaar zijn verschijnen ze automatisch op deze pagina.
            </p>
            <p>
              Neem intussen contact op met je opleidingslocatie voor de actuele
              eisen. Examens worden wel al afgenomen door erkende locaties.
            </p>
          </InfoCard>

          <InfoCard
            tone="instructeur"
            icon={<InformationCircleIcon className="size-5" />}
            title="Wat komt hier wél straks?"
          >
            <p>
              Hetzelfde type overzicht als op de consumentenpagina's: een
              module-overzicht per niveau, een programmaoverzicht waarin elke
              competentie wordt uitgewerkt, en voor ingelogde actieve
              instructeurs de specifieke eisomschrijving per competentie.
            </p>
          </InfoCard>
        </div>
      )}
    </div>
  );
}
