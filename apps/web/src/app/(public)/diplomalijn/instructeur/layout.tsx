"use cache";
import { constants } from "@nawadi/lib";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import MdxPageHeader from "~/app/(public)/_components/mdx-page-header";
import { Prose } from "~/app/(public)/_components/prose";
import { getAllDiplomalijnInstructeurPages } from "~/lib/mdx-pages";
import SideNav from "./_components/side-nav";

export const metadata: Metadata = {
  title: {
    template: `%s - Diplomalijn instructeurs | ${constants.APP_NAME}`,
    default: `Diplomalijn instructeurs | ${constants.APP_NAME}`,
  },
  alternates: null,
};

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  cacheLife("days");

  const pages = await getAllDiplomalijnInstructeurPages();

  return (
    <main>
      <MdxPageHeader pages={pages} />
      <div className="mt-12 grid grid-cols-1 items-start gap-12 px-4 sm:grid-cols-[1fr_3fr] lg:px-16">
        <div className="flex justify-end h-full">
          <SideNav
            pages={{
              general: pages.filter(
                (page) =>
                  page.pathSegments.length === 0 &&
                  !page.title.startsWith("Instructeur"),
              ),
              instructeur: pages.filter(
                (page) =>
                  page.pathSegments.length === 0 &&
                  page.title.startsWith("Instructeur"),
              ),
              leercoach: pages.filter(
                (page) =>
                  page.pathSegments.length > 0 &&
                  page.pathSegments.includes("leercoach"),
              ),
              beoordelaar: pages.filter(
                (page) =>
                  page.pathSegments.length > 0 &&
                  page.pathSegments.includes("pvb-beoordelaar"),
              ),
            }}
          />
        </div>
        <Prose className="max-w-prose" data-mdx-content>
          {children}
        </Prose>
      </div>
    </main>
  );
}
