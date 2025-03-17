import Link from "next/link";

import { DataInteractive } from "@headlessui/react";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { BellIcon } from "@heroicons/react/24/outline";

const notification = {
  title: "Nieuws: Dit is een testbericht",
  linkLabel: "Lees de aankondiging",
  link: "/actueel",
};

export default function NotificationBar() {
  return (
    <section className="flex justify-center lg:justify-between items-center gap-2 bg-white sm:px-28 py-2 text-branding-orange">
      <p className="flex flex-1 items-center gap-x-1.5 font-bold text-sm uppercase leading-none">
        <BellIcon className="size-4" strokeWidth={3} />
        {notification.title}
      </p>

      <div className="flex flex-1 justify-end">
        <DataInteractive>
          <Link
            href={notification.link}
            className="flex items-center gap-x-1.5 font-bold text-sm uppercase"
          >
            {notification.linkLabel} <ArrowRightIcon className="size-4" />
          </Link>
        </DataInteractive>
      </div>
    </section>
  );
}
