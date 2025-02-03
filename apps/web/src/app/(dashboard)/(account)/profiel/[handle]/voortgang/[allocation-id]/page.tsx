import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import dayjs from "~/lib/dayjs";
import { retrieveStudentAllocationWithCurriculumForPerson } from "~/lib/nwd";
import { CourseCard } from "./_components/course-card";

export default async function Page(
  props: {
    params: Promise<{ handle: string; "allocation-id": string }>;
  }
) {
  const params = await props.params;
  const allocation = await retrieveStudentAllocationWithCurriculumForPerson(
    params["allocation-id"],
  );

  if (!allocation) {
    return notFound();
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/profiel/${params.handle}`}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Jouw profiel
        </Link>
      </div>

      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div className="lg:col-start-3 lg:row-end-1">
          <div className="flex items-center justify-between">
            <Subheading>Samenvatting</Subheading>
          </div>
          <Divider className="mt-4" />
          <DescriptionList>
            <DescriptionTerm>Vaarlocatie</DescriptionTerm>
            <DescriptionDetails>{allocation.location.name}</DescriptionDetails>

            <DescriptionTerm>Bijgewerkt tot</DescriptionTerm>
            <DescriptionDetails>
              {dayjs(allocation.progressVisibleForStudentUpUntil)
                .tz()
                .format("DD-MM-YYYY HH:mm")}
            </DescriptionDetails>
          </DescriptionList>
        </div>

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <div className="flex items-center justify-between">
            <Subheading>Cursuskaart</Subheading>
          </div>
          <Divider className="mt-4" />
          <CourseCard cohortAllocationId={params["allocation-id"]} />
        </div>

        {/* <div className="lg:col-start-3">
          <Subheading>Tijdlijn</Subheading>
          <Divider className="mt-4" />
        </div> */}
      </div>
    </>
  );
}
