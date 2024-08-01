import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  AcademicCapIcon,
  ArchiveBoxXMarkIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import clsx from "clsx";
import dayjs from "dayjs";
import { PropsWithChildren } from "react";

export type TimelineEvent = { date: string } & (
  | {
      type: "added-to-cohort";
    }
  | {
      type: "competencies-completed";
      competencies: {
        module: string;
        competency: string;
      }[];
      by: string;
    }
  | {
      type: "competencies-progress";
      competencies: {
        module: string;
        competency: string;
        progress: number;
      }[];
      by: string;
    }
  | {
      type: "competencies-removed";
      competencies: {
        module: string;
        competency: string;
      }[];
      by: string;
    }
  | {
      type: "certificate-achieved";
    }
);

export default function Timeline({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <ul role="list" className="-mb-8 mt-4">
      {timeline.map((event, eventIdx) => (
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
            ) : event.type === "competencies-completed" ? (
              <TimelineEventCompetenciesCompleted event={event} />
            ) : event.type === "competencies-progress" ? (
              <TimelineEventCompetenciesProgress event={event} />
            ) : event.type === "competencies-removed" ? (
              <TimelineEventCompetenciesRemoved event={event} />
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
  color,
  date,
  children,
}: PropsWithChildren<{
  icon: React.ElementType;
  color: "zinc" | "blue" | "red" | "green";
  date: string;
}>) {
  return (
    <div className="relative flex space-x-3">
      <div>
        <span
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-full ring-8 bg-white border border-zinc-950/10 ring-white",
            color === "zinc"
              ? "text-zinc-500"
              : color === "blue"
                ? "text-blue-500"
                : color === "red"
                  ? "text-red-500"
                  : color === "green" && "text-green-500",
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
    <TimelineEvent icon={UserIcon} color="zinc" date={event.date}>
      <span>Toegevoegd aan cohort</span>
    </TimelineEvent>
  );
}

function TimelineEventCompetenciesCompleted({
  event,
}: {
  event: TimelineEvent & { type: "competencies-completed" };
}) {
  return (
    <TimelineEvent
      icon={ClipboardDocumentCheckIcon}
      color="zinc"
      date={event.date}
    >
      <Disclosure>
        <DisclosureButton className="group flex gap-1 text-left">
          <div>
            Competenties afgerond door{" "}
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
              .reduce<{ module: string; competencies: string[] }[]>(
                (acc, curr) => {
                  const currModule = acc.find((m) => m.module === curr.module);
                  if (currModule) {
                    currModule.competencies.push(curr.competency);
                  } else {
                    acc.push({
                      module: curr.module,
                      competencies: [curr.competency],
                    });
                  }
                  return acc;
                },
                [],
              )
              .map((competency) => (
                <li key={competency.module} className="mt-1">
                  <span className="text-zinc-950 font-semibold">
                    {competency.module}
                  </span>
                  <ul>
                    {competency.competencies.map((competency) => (
                      <li key={competency}>- {competency}</li>
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

function TimelineEventCompetenciesProgress({
  event,
}: {
  event: TimelineEvent & { type: "competencies-progress" };
}) {
  return (
    <TimelineEvent
      icon={ClipboardDocumentListIcon}
      color="zinc"
      date={event.date}
    >
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
                  module: string;
                  competencies: { competency: string; progress: number }[];
                }[]
              >((acc, curr) => {
                const currModule = acc.find((m) => m.module === curr.module);
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
              .map((competency) => (
                <li key={competency.module} className="mt-1">
                  <span className="text-zinc-950 font-semibold">
                    {competency.module}
                  </span>
                  <ul>
                    {competency.competencies.map((competency) => (
                      <li
                        key={competency.competency}
                        className="flex justify-between"
                      >
                        - {competency.competency}
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

function TimelineEventCompetenciesRemoved({
  event,
}: {
  event: TimelineEvent & { type: "competencies-removed" };
}) {
  return (
    <TimelineEvent icon={ArchiveBoxXMarkIcon} color="zinc" date={event.date}>
      <Disclosure>
        <DisclosureButton className="group flex gap-1 text-left">
          <div>
            Competenties verwijderd door{" "}
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
              .reduce<{ module: string; competencies: string[] }[]>(
                (acc, curr) => {
                  const currModule = acc.find((m) => m.module === curr.module);
                  if (currModule) {
                    currModule.competencies.push(curr.competency);
                  } else {
                    acc.push({
                      module: curr.module,
                      competencies: [curr.competency],
                    });
                  }
                  return acc;
                },
                [],
              )
              .map((competency) => (
                <li key={competency.module} className="mt-1">
                  <span className="text-zinc-950 font-semibold">
                    {competency.module}
                  </span>
                  <ul>
                    {competency.competencies.map((competency) => (
                      <li key={competency}>- {competency}</li>
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
    <TimelineEvent icon={AcademicCapIcon} color="blue" date={event.date}>
      <span className="text-zinc-950 font-semibold">Diploma behaald!</span>
    </TimelineEvent>
  );
}
