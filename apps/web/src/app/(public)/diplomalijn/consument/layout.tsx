"use cache";
import { constants } from "@nawadi/lib";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import MdxPageHeader from "~/app/(public)/_components/mdx-page-header";
import { Prose } from "~/app/(public)/_components/prose";
import { getAllDiplomalijnConsumentenPages } from "~/lib/mdx-pages";
import { listDisciplines } from "~/lib/nwd";
import SideNavDiplomalijn from "./_components/side-nav";

export const metadata: Metadata = {
  title: {
    template: `%s - Diplomalijn consumenten | ${constants.APP_NAME}`,
    default: `Diplomalijn consumenten | ${constants.APP_NAME}`,
  },
  alternates: null,
};

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  cacheLife("days");

  const [pages, disciplines] = await Promise.all([
    getAllDiplomalijnConsumentenPages(),
    listDisciplines(),
  ]);

  return (
    <main>
      <MdxPageHeader pages={pages} />
      <div className="mt-12 grid grid-cols-1 items-start gap-12 px-4 sm:grid-cols-[1fr_3fr] lg:px-16">
        <div className="flex justify-end h-full">
          <SideNavDiplomalijn
            pages={{
              general: [
                ...pages.filter((page) => {
                  return page.pathSegments.length === 0;
                }),
                {
                  type: "external",
                  href: "/help/artikel/hoe-is-de-diplomalijn-van-het-nwd-opgebouwd#veelgestelde-vragen",
                  title: "Veelgestelde vragen",
                },
              ],
            }}
            disciplines={disciplines}
          />
        </div>
        <div className="flex flex-col justify-center">
          <Prose className="max-w-prose w-full mr-auto" data-mdx-content>
            {children}
          </Prose>
        </div>
      </div>
    </main>
  );
}
