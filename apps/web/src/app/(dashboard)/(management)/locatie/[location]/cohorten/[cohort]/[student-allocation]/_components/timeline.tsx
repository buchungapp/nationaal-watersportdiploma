import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  AcademicCapIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import clsx from "clsx";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Code } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import {
  listAllocationHistory,
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
        date: batch[0]!.createdAt,
        modules: batch.reduce(
          (acc, item) => {
            const module = item.module;
            const competencies = acc.find(
              (item) => item.module.id === module.id,
            );

            if (competencies) {
              competencies.competencies.push({
                competency: item.competency,
                progress: item.progress,
              });
            } else {
              acc.push({
                module,
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

export default async function Timeline({
  cohortId,
  allocationId,
}: {
  cohortId: string;
  allocationId: string;
}) {
  const allocation = await retrieveStudentAllocationWithCurriculum(
    cohortId,
    allocationId,
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

  if (allocation.certificate && allocation.certificate.issuedAt) {
    timeline.push({
      type: "certificate-achieved",
      certificateHandle: allocation.certificate.handle,
      date: allocation.certificate.issuedAt,
    });
  }

  const batchedProgress = batchProgress(progress);
  timeline.push(...batchedProgressToTimelineEvent(batchedProgress));

  return (
    <ul role="list" className="-mb-8 mt-4">
      {timeline
        .toSorted(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .map((event, eventIdx) => (
          <li key={event.type + event.date}>
            <div className="relative pb-8">
              {eventIdx !== timeline.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-4 -ml-px h-full w-px bg-zinc-950/10 dark:bg-white/10"
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
    <div className="relative flex space-x-3">
      <div>
        <span
          className={clsx(
            "text-zinc-500 flex h-8 w-8 items-center justify-center rounded-full ring-8 bg-white border border-zinc-950/10 ring-white",
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
        <div className="text-zinc-500 text-sm overflow-hidden">{children}</div>
        <div className="whitespace-nowrap text-right text-sm text-gray-500">
          <time dateTime={date}>{dayjs(date).format("MMM DD")}</time>
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
    <TimelineEvent icon={UserIcon} date={event.date}>
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
    <TimelineEvent icon={ClipboardDocumentListIcon} date={event.date}>
      <Disclosure>
        <DisclosureButton className="group flex gap-1 text-left">
          <div>
            Competenties voortgang bijgewerkt door{" "}
            <span className="font-semibold text-zinc-950">{event.by}</span>
          </div>
          <ChevronDownIcon
            className={
              "h-4 w-4 transition-transform group-data-[open]:rotate-180 shrink-0 mt-1"
            }
          />
        </DisclosureButton>
        <DisclosurePanel>
          <ul>
            {event.modules
              .toSorted((a, b) => a.module.weight - b.module.weight)
              .map((module) => (
                <li key={module.module.id} className="mt-1">
                  <span className="text-zinc-950 font-semibold">
                    {module.module.title ?? "Onbekend"}
                  </span>
                  <ul>
                    {module.competencies
                      .toSorted(
                        (a, b) => a.competency.weight - b.competency.weight,
                      )
                      .map((competency) => (
                        // TODO: fix overflow
                        <li
                          key={competency.competency.id}
                          className="flex justify-between relative gap-1"
                        >
                          {competency.progress <= 0 ? (
                            <div className="absolute top-1/2 -translate-y-1/2 w-full border-t border-zinc-950" />
                          ) : null}
                          <span className="">
                            {"- "}
                            {competency.competency.title ?? "Onbekend"}
                          </span>
                          <span className="font-medium">
                            {competency.progress}%
                          </span>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
          </ul>
        </DisclosurePanel>
      </Disclosure>
    </TimelineEvent>
  );
}

function TimelineEventCertificateAchieved({
  event,
}: {
  event: TimelineEvent & { type: "certificate-achieved" };
}) {
  return (
    <TimelineEvent icon={AcademicCapIcon} date={event.date}>
      <span className="text-zinc-950 font-semibold">Diploma behaald! 🎉</span>
      <br />
      <Code>{event.certificateHandle}</Code>
    </TimelineEvent>
  );
}
