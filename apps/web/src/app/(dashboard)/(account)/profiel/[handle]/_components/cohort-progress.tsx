import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { getPersonByHandle, listActiveCohortsForPerson } from "~/lib/nwd";
import {
  GridList,
  GridListHeader,
  GridListItem,
} from "../../../../_components/grid-list";

interface Props {
  params: Promise<{ handle: string }>;
}

async function CohortProgressContent({ params }: Props) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);
  const allocations = await listActiveCohortsForPerson(person.id);

  if (allocations.length === 0) {
    return null;
  }

  return (
    <StackedLayoutCard className="lg:col-span-2">
      <Subheading>Jouw NWD-voortgang</Subheading>
      <Text>
        Op dit moment zit je in de volgende actieve NWD-cursussen, waarbij de
        vaarlocatie ervoor heeft gekozen om jouw voortgang inzichtelijk te
        maken. Klik je cursuskaart aan om je voortgang te bekijken.
      </Text>
      <Divider className="mt-2 mb-4" />
      <GridList>
        {allocations.map((allocation) => (
          <GridListItem key={allocation.id}>
            <GridListHeader
              href={`/profiel/${person.handle}/voortgang/${allocation.id}`}
            >
              <div className="font-medium text-slate-900 text-sm leading-6">
                {allocation.studentCurriculum?.program.title ??
                  `${allocation.studentCurriculum?.course.title} ${allocation.studentCurriculum?.degree.title}`}
              </div>
            </GridListHeader>
            <DescriptionList className="px-6">
              <DescriptionTerm>Vaartuig</DescriptionTerm>
              <DescriptionDetails>
                {allocation.studentCurriculum?.gearType.title}
              </DescriptionDetails>

              <DescriptionTerm>Vaarlocatie</DescriptionTerm>
              <DescriptionDetails>
                {allocation.location.name}
              </DescriptionDetails>

              <DescriptionTerm>Bijgewerkt tot</DescriptionTerm>
              <DescriptionDetails>
                {dayjs(allocation.progressVisibleForStudentUpUntil)
                  .tz()
                  .format("DD-MM-YYYY HH:mm")}
              </DescriptionDetails>
            </DescriptionList>
          </GridListItem>
        ))}
      </GridList>
    </StackedLayoutCard>
  );
}

export function PersonCohortProgress(props: Props) {
  return (
    <Suspense fallback={null}>
      <CohortProgressContent {...props} />
    </Suspense>
  );
}
