import Link from "next/link";

import { constants } from "@nawadi/lib";

import { DataInteractive } from "@headlessui/react";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import { getUserOrThrow } from "~/lib/nwd";
import {
  Facebook,
  Instagram,
  LinkedIn,
  TikTok,
  YouTube,
} from "../../../_components/socials";

async function AccountButton() {
  const isLoggedIn = await getUserOrThrow()
    .then((res) => !!res)
    .catch(() => false);

  return (
    <DataInteractive>
      <Link
        href={isLoggedIn ? "/account" : "/login"}
        className="flex items-center text-sm font-semibold uppercase gap-x-1.5"
      >
        {isLoggedIn ? "Account" : "Login"} <ArrowRightIcon className="size-4" />
      </Link>
    </DataInteractive>
  );
}

const socials = [
  {
    name: "Facebook",
    icon: Facebook,
    link: constants.FACEBOOK_URL,
  },
  {
    name: "Instagram",
    icon: Instagram,
    link: constants.INSTAGRAM_URL,
  },
  {
    name: "LinkedIn",
    icon: LinkedIn,
    link: constants.LINKEDIN_URL,
  },
  {
    name: "TikTok",
    icon: TikTok,
    link: constants.TIKTOK_URL,
  },
  {
    name: "YouTube",
    icon: YouTube,
    link: constants.YOUTUBE_URL,
  },
];

export default function Trustbar() {
  return (
    <section className="flex items-center justify-center gap-2 py-2 text-white sm:px-28 lg:justify-between">
      <ul className="hidden flex-1 items-center gap-6 lg:flex">
        {socials.map((social, i) => (
          <li key={i}>
            <Link
              className="group relative"
              href={social.link}
              target="_blank"
              referrerPolicy="no-referrer"
            >
              {/* Background on hover */}
              <div className="absolute inset-0 scale-150 rounded bg-white bg-opacity-0 transition-opacity group-hover:bg-opacity-100" />
              <social.icon className="relative h-4 w-4 group-hover:text-[--brand-color]" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="flex-1 text-center text-sm font-semibold uppercase leading-none">
        {constants.APP_SLOGAN}
      </p>

      <div className="flex-1 flex justify-end max-lg:hidden">
        <Suspense
          fallback={
            <DataInteractive>
              <Link
                href="/login"
                className="flex items-center text-sm font-semibold uppercase gap-x-1.5"
              >
                Login <ArrowRightIcon className="size-4" />
              </Link>
            </DataInteractive>
          }
        >
          <AccountButton />
        </Suspense>
      </div>
    </section>
  );
}
