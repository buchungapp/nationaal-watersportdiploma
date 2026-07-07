import {
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Breadcrumb from "~/app/(public)/_components/breadcrumb";
import { EigenvaardigheidCourseDetail } from "../../_components/eigenvaardigheid-course-detail";
import { InfoCard } from "../../_components/info-card";
import { EIGENVAARDIGHEID_DISCIPLINES } from "../../_data/eigenvaardigheid-disciplines";
import {
  JACHTZEILEN_EV_BASE,
  JACHTZEILEN_EV_HANDLE,
} from "../../_data/jachtzeilen-ev";
import { listCourses, retrieveDisciplineByHandle } from "~/lib/nwd";

export const generateMetadata = async (props: {
  params: Promise<{ discipline: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const discipline = await retrieveDisciplineByHandle(params.discipline);
  const title =
    discipline?.title ??
    EIGENVAARDIGHEID_DISCIPLINES.find((d) => d.handle === params.discipline)
      ?.title;
  if (!title) return {};
  return {
    title: `Eigenvaardigheid ${title}`,
    description: `NWD A, B en C voor ${title}`,
  };
};

function EigenvaardigheidEmptyState({
  disciplineTitle,
  breadcrumbs,
}: {
  disciplineTitle: string;
  breadcrumbs: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <Breadcrumb items={breadcrumbs} />

      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        Eigenvaardigheid {disciplineTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        NWD A, B en C voor {disciplineTitle}. NWD A en B worden via een examen
        vastgesteld bij een erkende opleidingslocatie. NWD C kent geen vaste
        modulestructuur en wordt beoordeeld tijdens een afrondingsweekend door
        twee Instructeurs 5.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <InfoCard
          tone="instructeur"
          icon={<ClipboardDocumentCheckIcon className="size-5" />}
          title="Modules en eisomschrijvingen nog niet gepubliceerd"
        >
          <p>
            De modules, competenties en exacte eisomschrijvingen voor NWD A, B
            en C {disciplineTitle} worden op dit moment ingericht. Zodra ze
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
            competentie wordt uitgewerkt, en voor ingelogde actieve instructeurs
            de specifieke eisomschrijving per competentie.
          </p>
        </InfoCard>
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{ discipline: string }>;
}) {
  const { discipline: disciplineHandle } = await props.params;

  if (disciplineHandle === JACHTZEILEN_EV_HANDLE) {
    redirect(JACHTZEILEN_EV_BASE);
  }

  const dbDiscipline = await retrieveDisciplineByHandle(disciplineHandle);
  const staticDiscipline = EIGENVAARDIGHEID_DISCIPLINES.find(
    (d) => d.handle === disciplineHandle,
  );

  if (!dbDiscipline && !staticDiscipline) notFound();

  const disciplineTitle =
    dbDiscipline?.title ?? staticDiscipline?.title ?? disciplineHandle;

  const breadcrumbs = [
    {
      label: "Eigenvaardigheid",
      href: "/diplomalijn/instructeur/eigenvaardigheid",
    },
    {
      label: disciplineTitle,
      href: `/diplomalijn/instructeur/eigenvaardigheid/${disciplineHandle}`,
    },
  ];

  if (!dbDiscipline) {
    return (
      <EigenvaardigheidEmptyState
        disciplineTitle={disciplineTitle}
        breadcrumbs={breadcrumbs}
      />
    );
  }

  const allCourses = await listCourses("instructeur");
  const instructeurCourses = allCourses.filter(
    (c) => c.discipline.id === dbDiscipline.id,
  );

  if (instructeurCourses.length !== 1) {
    notFound();
  }

  const course = instructeurCourses[0]!;

  return (
    <EigenvaardigheidCourseDetail
      course={course}
      disciplineId={dbDiscipline.id}
      disciplineTitle={disciplineTitle}
      heading={`Eigenvaardigheid ${disciplineTitle}`}
      breadcrumbs={breadcrumbs}
    />
  );
}
