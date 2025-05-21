import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  AcademicCapIcon,
  ChartBarIcon,
  ChevronDownIcon,
  UserPlusIcon,
} from "@heroicons/react/16/solid";
import clsx from "clsx";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";
import React, { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Code, Strong } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import {
  listAllocationHistory,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";

export type TimelineEvent = { date: string } & (
  | {
      type: "added-to-cohort";
    }
  | {
      type: "competencies-progress";
      modules: {
        module: { id: string; title: string | null; weight: number };
        competencies: {
          competency: {
            id: string;
            title: string | null;
            weight: number;
          };
          progress: number;
        }[];
      }[];
      by: string;
    }
  | {
      type: "certificate-achieved";
      certificateHandle: string;
    }
);

type ProgressItem = NonNullable<
  Awaited<ReturnType<typeof listAllocationHistory>>
>[number];

type ProgressItemNumber = Omit<ProgressItem, "progress"> & { progress: number };

const BATCH_TIME_DIFF = 1000 * 60 * 10; // 10 minutes

function batchProgress(progress: ProgressItem[]) {
  progress.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const seperatedByInstructor: {
    person: ProgressItem["person"];
    items: ProgressItemNumber[];
  }[] = [];
  for (const progressItem of progress) {
    const last = seperatedByInstructor[seperatedByInstructor.length - 1];
    if (last && last.person.id === progressItem.person.id) {
      last.items.push({
        ...progressItem,
        progress: Number(progressItem.progress),
      });
    } else {
      seperatedByInstructor.push({
        person: progressItem.person,
        items: [
          {
            ...progressItem,
            progress: Number(progressItem.progress),
          },
        ],
      });
    }
  }

  const batchedProgress = [];
  const lastProgressState = new Map<string, number>();

  for (const { person, items } of seperatedByInstructor) {
    if (items.length < 1) {
      continue;
    }

    // Batch per time interval
    const batchedItems: ProgressItemNumber[][] = [];
    let lastBatchDate = 0;

    for (const progressItem of items) {
      const createdAt = new Date(progressItem.createdAt).getTime();
      if (Math.abs(createdAt - lastBatchDate) > BATCH_TIME_DIFF) {
        batchedItems.push([progressItem]);
        lastBatchDate = createdAt;
        continue;
      }

      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const lastBatch = batchedItems[batchedItems.length - 1]!;
      lastBatch.push(progressItem);
    }

    // Last item per competency
    const lastBatchedItems: ProgressItemNumber[][] = [];
    for (const batch of batchedItems) {
      const items = batch.filter((item) => {
        const sameCompentency = batch.filter(
          (other) =>
            other.module.id === item.module.id &&
            other.competency.id === item.competency.id,
        );

        const lastItem = Math.max(
          ...sameCompentency.map((item) => new Date(item.createdAt).getTime()),
        );
        return new Date(item.createdAt).getTime() === lastItem;
      });

      if (items.length > 0) {
        lastBatchedItems.push(items);
      }
    }

    // Merge batched items
    const mergedBatchedItems: ProgressItemNumber[][] = [];
    for (const batch of lastBatchedItems) {
      const mergedBatch: ProgressItemNumber[] = [];

      for (const progressItem of batch) {
        const lastProgress = lastProgressState.get(progressItem.competency.id);
        if ((lastProgress ?? 0) === progressItem.progress) {
          continue;
        }

        mergedBatch.push(progressItem);
        lastProgressState.set(
          progressItem.competency.id,
          progressItem.progress,
        );
      }

      if (mergedBatch.length > 0) {
        mergedBatchedItems.push(mergedBatch);
      }
    }

    if (mergedBatchedItems.length < 1) {
      continue;
    }

    for (const batch of mergedBatchedItems) {
      batchedProgress.push({
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        date: batch[0]!.createdAt,
        modules: batch.reduce(
          (acc, item) => {
            const currModule = item.module;
            const competencies = acc.find(
              (item) => item.module.id === currModule.id,
            );

            if (competencies) {
              competencies.competencies.push({
                competency: item.competency,
                progress: item.progress,
              });
            } else {
              acc.push({
                module: currModule,
                competencies: [
                  {
                    competency: item.competency,
                    progress: item.progress,
                  },
                ],
              });
            }

            return acc;
          },
          [] as {
            module: ProgressItem["module"];
            competencies: {
              competency: ProgressItem["competency"];
              progress: number;
            }[];
          }[],
        ),
        person: person,
      });
    }
  }

  return batchedProgress;
}

function batchedProgressToTimelineEvent(
  batchedProgress: {
    date: string;
    modules: {
      module: ProgressItem["module"];
      competencies: {
        competency: ProgressItem["competency"];
        progress: ProgressItemNumber["progress"];
      }[];
    }[];
    person: ProgressItem["person"];
  }[],
) {
  return batchedProgress.map((batch) => ({
    type: "competencies-progress" as const,
    date: batch.date,
    modules: batch.modules,
    by: [
      batch.person.firstName,
      batch.person.lastNamePrefix,
      batch.person.lastName,
    ]
      .filter(Boolean)
      .join(" "),
  }));
}

type TimelineProps = {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
};

async function TimelineContent(props: TimelineProps) {
  const params = await props.params;

  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

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

  const progress = await listAllocationHistory(
    allocation.id,
    allocation.cohort.id,
  );

  if (!progress) {
    notFound();
  }

  const timeline: TimelineEvent[] = [
    {
      type: "added-to-cohort",
      date: allocation.createdAt,
    },
  ];

  if (allocation.certificate?.issuedAt) {
    timeline.push({
      type: "certificate-achieved",
      certificateHandle: allocation.certificate.handle,
      date: allocation.certificate.issuedAt,
    });
  }

  const batchedProgress = batchProgress(progress);
  timeline.push(...batchedProgressToTimelineEvent(batchedProgress));

  return (
    <div className="lg:col-start-3 lg:row-start-1">
      <div className="flex justify-between items-center">
        <Subheading>Tijdlijn</Subheading>
      </div>
      <Divider className="mt-4" />
      <ul className="mt-4 -mb-8">
        {timeline
          .sort((a, b) => (dayjs(a.date).isAfter(dayjs(b.date)) ? -1 : 1))
          .map((event, eventIdx) => (
            <li key={event.type + event.date}>
              <div className="relative pb-8">
                {eventIdx !== timeline.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="top-4 left-4 absolute bg-zinc-950/10 dark:bg-white/10 -ml-px w-px h-full"
                  />
                ) : null}
                {event.type === "added-to-cohort" ? (
                  <TimelineEventAddedToCohort event={event} />
                ) : event.type === "competencies-progress" ? (
                  <TimelineEventCompetenciesProgress event={event} />
                ) : event.type === "certificate-achieved" ? (
                  <TimelineEventCertificateAchieved event={event} />
                ) : null}
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function TimelineFallback() {
  return (
    <div className="lg:col-start-3 lg:row-start-1">
      <div className="flex justify-between items-center">
        <Subheading>Tijdlijn</Subheading>
      </div>
      <Divider className="mt-4" />
      <div className="bg-slate-200 mt-4 rounded-lg w-full h-18 animate-pulse" />
    </div>
  );
}

export default async function Timeline(props: TimelineProps) {
  return (
    <Suspense fallback={<TimelineFallback />}>
      <TimelineContent params={props.params} />
    </Suspense>
  );
}

function TimelineEvent({
  icon: Icon,
  date,
  children,
}: PropsWithChildren<{
  icon: React.ElementType;
  date: string;
}>) {
  return (
    <div className="relative flex space-x-3.5">
      <span
        className={clsx(
          "flex justify-center items-center bg-white border border-zinc-950/10 rounded-full ring-8 ring-white size-6 text-zinc-400",
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="flex flex-1 justify-between space-x-4 min-w-0">
        <div className="overflow-hidden text-zinc-500 text-sm">{children}</div>
        <div className="text-slate-500 text-sm text-right">
          <time
            dateTime={date}
            title={dayjs(date).tz().format("dddd D MMMM YYYY [om] HH:mm")}
          >
            {dayjs(date).fromNow()}
          </time>
        </div>
      </div>
    </div>
  );
}

function TimelineEventAddedToCohort({
  event,
}: {
  event: TimelineEvent & { type: "added-to-cohort" };
}) {
  return (
    <TimelineEvent icon={UserPlusIcon} date={event.date}>
      <span>Toegevoegd aan cohort</span>
    </TimelineEvent>
  );
}

function TimelineEventCompetenciesProgress({
  event,
}: {
  event: TimelineEvent & { type: "competencies-progress" };
}) {
  return (
    <div className="relative flex space-x-3.5">
      <span
        className={clsx(
          "flex justify-center items-center bg-white border border-zinc-950/10 rounded-full ring-8 ring-white size-6 text-zinc-400",
        )}
      >
        <ChartBarIcon aria-hidden="true" className="size-4" />
      </span>
      <div className="flex flex-1 justify-between space-x-4 min-w-0">
        <div className="overflow-hidden text-zinc-500 text-sm">
          <Disclosure>
            <DisclosureButton className="group flex gap-1 text-left">
              <div>
                Voortgang bijgewerkt door{" "}
                <span className="font-semibold text-zinc-950 whitespace-nowrap">
                  {event.by}
                </span>{" "}
                <ChevronDownIcon
                  className={
                    "size-4 transition-transform inline-flex group-data-open:rotate-180 shrink-0 leading-5"
                  }
                />
              </div>
              <div className="text-slate-500 text-sm text-right">
                <time
                  dateTime={event.date}
                  title={dayjs(event.date)
                    .tz()
                    .format("dddd D MMMM YYYY [om] HH:mm")}
                >
                  {dayjs(event.date).fromNow()}
                </time>
              </div>
            </DisclosureButton>
            <DisclosurePanel>
              <ul className="space-y-2.5 mt-4">
                {event.modules
                  .sort((a, b) => a.module.weight - b.module.weight)
                  .map((module, index) => {
                    return (
                      <React.Fragment key={module.module.id}>
                        <li className="">
                          <Disclosure>
                            <DisclosureButton className="group flex justify-between items-center gap-x-2 w-full">
                              <Strong>{module.module.title ?? ""}</Strong>

                              <ChevronDownIcon
                                className={
                                  "size-4 transition-transform group-data-open:rotate-180 shrink-0 mt-0"
                                }
                              />
                            </DisclosureButton>
                            <DisclosurePanel>
                              <ul className="space-y-0.5 mt-1">
                                {module.competencies
                                  .sort(
                                    (a, b) =>
                                      a.competency.weight - b.competency.weight,
                                  )
                                  .map((competency) => (
                                    <li
                                      key={competency.competency.id}
                                      className="relative flex justify-between gap-1 max-w-full"
                                    >
                                      {competency.progress <= 0 ? (
                                        <div className="top-1/2 absolute border-zinc-950 border-t w-full -translate-y-1/2" />
                                      ) : null}
                                      <span className="hyphens-auto">
                                        {competency.competency.title ?? ""}
                                      </span>
                                      <span className="">
                                        {`${competency.progress}%`}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </DisclosurePanel>
                          </Disclosure>
                        </li>
                        {index < event.modules.length - 1 ? (
                          <Divider soft />
                        ) : null}
                      </React.Fragment>
                    );
                  })}
              </ul>
            </DisclosurePanel>
          </Disclosure>
        </div>
      </div>
    </div>
  );
}

function TimelineEventCertificateAchieved({
  event,
}: {
  event: TimelineEvent & { type: "certificate-achieved" };
}) {
  return (
    <TimelineEvent icon={AcademicCapIcon} date={event.date}>
      <span className="font-semibold text-zinc-950">Diploma uitgegeven 🎉</span>
      <br />
      <Code>{event.certificateHandle}</Code>
    </TimelineEvent>
  );
}
