import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { Divider } from "@tremor/react";
import dayjs from "dayjs";
import { notFound } from "next/navigation";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import { Strong } from "~/app/(dashboard)/_components/text";
import {
  retrieveCohortByHandle,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import { CourseCard } from "./_components/course-card";

export default async function Page({
  params,
}: {
  params: { location: string; cohort: string; "student-allocation": string };
}) {
  const cohort = await retrieveCohortByHandle(params.cohort);

  if (!cohort) {
    notFound();
  }

  const allocation = await retrieveStudentAllocationWithCurriculum(
    cohort.id,
    params["student-allocation"],
  );

  if (!allocation) {
    notFound();
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/locatie/${params.location}/cohorten/${params.cohort}`}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Cohort {cohort.label}
        </Link>
      </div>

      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div className="lg:col-start-3 lg:row-end-1">
          <Subheading>Samenvatting</Subheading>
          <Divider className="mt-4" />
          <DescriptionList>
            <DescriptionTerm>Cursist</DescriptionTerm>
            <DescriptionDetails>
              <Strong>
                {[
                  allocation.person.firstName,
                  allocation.person.lastNamePrefix,
                  allocation.person.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </Strong>
            </DescriptionDetails>

            <DescriptionTerm>Leeftijd</DescriptionTerm>
            <DescriptionDetails>
              {allocation.person.dateOfBirth ? (
                <span>
                  {`${dayjs().diff(dayjs(allocation.person.dateOfBirth), "year")} jr.`}{" "}
                  <span className="text-zinc-500">{`(${dayjs(allocation.person.dateOfBirth).format("DD-MM-YYYY")})`}</span>
                </span>
              ) : null}
            </DescriptionDetails>

            <DescriptionTerm>Cohort</DescriptionTerm>
            <DescriptionDetails>{cohort.label}</DescriptionDetails>

            <DescriptionTerm>Tags</DescriptionTerm>
            <DescriptionDetails>
              <div className="flex gap-x-2 items-center">
                {allocation.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </DescriptionDetails>
          </DescriptionList>
        </div>

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <Subheading>Cursus</Subheading>
          <Divider className="mt-4" />
          <CourseCard cohortId={cohort.id} cohortAllocationId={allocation.id} />
        </div>

        <div className="lg:col-start-3">
          <Subheading>Tijdlijn</Subheading>
          <Divider className="mt-4" />
        </div>
      </div>
    </>
  );
}
