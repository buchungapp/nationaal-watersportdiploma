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
      competencies: {
        module: {
          id: string;
          title: string | null;
          weight: number;
        };
        competency: {
          id: string;
          title: string | null;
          weight: number;
        };
        progress: number;
      }[];
      by: string;
    }
  | {
      type: "certificate-achieved";
      certificateHandle: string;
    }
);

type ProgressTracked = NonNullable<
  Awaited<ReturnType<typeof listAllocationHistory>>
>[number];
const BATCH_TIME_DIFF = 1000 * 60 * 10; // 10 minutes

function batchProgress(progress: ProgressTracked[]): ProgressTracked[][] {
  const batchedByInstructor = progress.reduce<
    | [
        [ProgressTracked, ...ProgressTracked[]],
        ...[ProgressTracked, ...ProgressTracked[]][],
      ]
    | null
  >((acc, curr) => {
    if (!acc) {
      return [[curr]];
    }

    const previous = acc[acc.length - 1]!;
    const lastInstructor = previous[0].person.id;
    if (lastInstructor === curr.person.id) {
      const lastProgress = previous[previous.length - 1]!;
      const lastProgressDate = new Date(lastProgress.createdAt).getTime();
      const currProgressDate = new Date(curr.createdAt).getTime();

      if (Math.abs(currProgressDate - lastProgressDate) < BATCH_TIME_DIFF) {
        previous.push(curr);
        return acc;
      } else {
        acc.push([curr]);
      }
    } else {
      acc.push([curr]);
    }

    return acc;
  }, null);

  if (!batchedByInstructor) return [];

  const reduced = batchedByInstructor.map(
    (batch) =>
      batch.reduce<[ProgressTracked, ...ProgressTracked[]] | null>(
        (acc, curr) => {
          if (!acc) {
            return [curr];
          }

          const sameCompetency = acc.find(
            (x) =>
              x.module.id === curr.module.id &&
              x.competency.id === curr.competency.id,
          );

          if (!sameCompetency) {
            acc.push(curr);
          } else {
            if (
              new Date(curr.createdAt).getTime() >
              new Date(sameCompetency.createdAt).getTime()
            ) {
              acc[acc.indexOf(sameCompetency)] = curr;
            }
          }

          return acc;
        },
        null,
      ) ?? [],
  );

  return reduced ?? [];
}

function batchedProgressToTimelineEvent(batchedProgress: ProgressTracked[][]) {
  return batchedProgress
    .map((batch) => {
      if (batch.length < 1) return null;

      const event: TimelineEvent = {
        type: "competencies-progress",
        date: batch[0]!.createdAt,
        competencies: batch.map((progress) => ({
          module: progress.module,
          competency: progress.competency,
          progress: Number(progress.progress),
        })),
        by: [
          batch[0]!.person.firstName,
          batch[0]!.person.lastNamePrefix,
          batch[0]!.person.lastName,
        ]
          .filter(Boolean)
          .join(" "),
      };

      return event;
    })
    .filter(Boolean) as TimelineEvent[];
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
        <div className="text-zinc-500 text-sm">{children}</div>
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
            {event.competencies
              .reduce<
                {
                  module: {
                    id: string;
                    title: string | null;
                    weight: number;
                  };
                  competencies: {
                    competency: {
                      id: string;
                      title: string | null;
                      weight: number;
                    };
                    progress: number;
                  }[];
                }[]
              >((acc, curr) => {
                const currModule = acc.find(
                  (m) => m.module.id === curr.module.id,
                );
                if (currModule) {
                  currModule.competencies.push({
                    competency: curr.competency,
                    progress: curr.progress,
                  });
                } else {
                  acc.push({
                    module: curr.module,
                    competencies: [
                      { competency: curr.competency, progress: curr.progress },
                    ],
                  });
                }
                return acc;
              }, [])
              .toSorted((a, b) => a.module.weight - b.module.weight)
              .map((competency) => (
                <li key={competency.module.id} className="mt-1">
                  <span className="text-zinc-950 font-semibold">
                    {competency.module.title ?? "Onbekend"}
                  </span>
                  <ul>
                    {competency.competencies
                      .toSorted((a, b) => b.progress - a.progress)
                      .map((competency) => (
                        <li
                          key={competency.competency.id}
                          className="flex justify-between relative"
                        >
                          {competency.progress <= 0 ? (
                            <div className="absolute top-1/2 -translate-y-1/2 w-full border-t border-zinc-950" />
                          ) : null}
                          {"- "}
                          {competency.competency.title ?? "Onbekend"}
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
