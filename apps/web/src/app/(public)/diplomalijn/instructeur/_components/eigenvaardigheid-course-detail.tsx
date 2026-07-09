import {
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Breadcrumb from "~/app/(public)/_components/breadcrumb";
import { ModuleOverview } from "~/app/(public)/diplomalijn/_components/module-overview";
import {
  listCurriculaByDiscipline,
  listProgramsForCourse,
  type retrieveCourseByHandle,
} from "~/lib/nwd";
import { InfoCard } from "./info-card";
import { JACHTZEILEN_EV_HANDLE } from "../_data/jachtzeilen-ev";

function disciplinesExplorerHref(
  disciplineHandle: string,
  courseHandle: string,
) {
  const disciplineParam =
    disciplineHandle === JACHTZEILEN_EV_HANDLE
      ? `${disciplineHandle}:${courseHandle}`
      : disciplineHandle;

  return `/diplomalijn/instructeur/eigenvaardigheid/disciplines?discipline=${encodeURIComponent(disciplineParam)}`;
}

type Course = NonNullable<Awaited<ReturnType<typeof retrieveCourseByHandle>>>;

type BreadcrumbItem = {
  label: string;
  href: string;
};

export async function EigenvaardigheidCourseDetail({
  course,
  disciplineId,
  disciplineTitle,
  breadcrumbs,
  heading,
}: {
  course: Course;
  disciplineId: string;
  disciplineTitle: string;
  breadcrumbs: BreadcrumbItem[];
  /** Defaults to course.title */
  heading?: string;
}) {
  const [allPrograms, curricula] = await Promise.all([
    listProgramsForCourse(course.id),
    listCurriculaByDiscipline(disciplineId),
  ]);

  const eigenvaardigheidPrograms = allPrograms
    .filter((p) => p.degree.rang >= 5)
    .sort((a, b) => a.degree.rang - b.degree.rang);

  const hasData = eigenvaardigheidPrograms.length > 0;
  const pageHeading = heading ?? course.title ?? disciplineTitle;

  return (
    <div>
      <Breadcrumb items={breadcrumbs} />

      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        {pageHeading}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        NWD A, B en C voor {pageHeading}. NWD A en B worden via een examen
        vastgesteld bij een erkende opleidingslocatie. NWD C kent geen vaste
        modulestructuur en wordt beoordeeld tijdens een afrondingsweekend door
        twee Instructeurs 5.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Het moduleoverzicht staat hieronder. Voor competenties, eisomschrijvingen
        en niveauvergelijking ga je naar{" "}
        <Link
          href={disciplinesExplorerHref(
            course.discipline.handle,
            course.handle,
          )}
          className="font-semibold text-branding-light hover:underline"
        >
          Disciplines
        </Link>
        .
      </p>

      {hasData ? (
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
        </>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          <InfoCard
            tone="instructeur"
            icon={<ClipboardDocumentCheckIcon className="size-5" />}
            title="Modules en eisomschrijvingen nog niet gepubliceerd"
          >
            <p>
              De modules, competenties en exacte eisomschrijvingen voor NWD A, B
              en C {pageHeading} worden op dit moment ingericht. Zodra ze
              beschikbaar zijn verschijnen ze automatisch op deze pagina.
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
              Hetzelfde type overzicht als op de consumentenpagina&apos;s: een
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
