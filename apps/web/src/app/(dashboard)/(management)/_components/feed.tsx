import clsx from "clsx";
import dayjs from "~/lib/dayjs";

import type React from "react";

export default function Feed({
  activities,
}: {
  activities: {
    id: string;
    label: React.ReactNode;
    dateTime: string;
  }[];
}) {
  return (
    <>
      <ul className="space-y-6">
        {activities.map((activityItem, activityItemIdx) => (
          <li key={activityItem.id} className="relative flex gap-x-4">
            <div
              className={clsx(
                activityItemIdx === activities.length - 1 ? "h-6" : "-bottom-6",
                "absolute left-0 top-0 flex w-6 justify-center",
              )}
            >
              <div className="w-px bg-slate-200" />
            </div>
            <div className="relative flex size-6 flex-none items-center justify-center bg-white">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-100 ring-1 ring-slate-300" />
            </div>
            <p className="flex-auto py-0.5 text-xs leading-5 text-slate-500">
              {activityItem.label}
            </p>
            <time
              dateTime={activityItem.dateTime}
              className="flex-none py-0.5 text-xs leading-5 text-slate-500"
            >
              {dayjs(activityItem.dateTime).toNow()}
            </time>
          </li>
        ))}
      </ul>
    </>
  );
}
