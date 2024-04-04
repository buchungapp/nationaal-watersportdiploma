import { APP_NAME } from "@nawadi/lib/constants";

import type { Metadata } from "next";
import MdxPageHeader from "~/app/_components/mdx-page-header";
import { Prose } from "~/app/_components/prose";
import { getAllDiplomalijnInstructeurPages } from "~/lib/mdx-pages";
import SideNavVereniging from "./_components/side-nav";

export const metadata: Metadata = {
  title: {
    template: `%s - Diplomalijn instructeurs | ${APP_NAME}`,
    default: `Diplomalijn instructeurs | ${APP_NAME}`,
  },
};

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pages = await getAllDiplomalijnInstructeurPages();

  return (
    <main>
      <MdxPageHeader pages={pages} />
      <div className="mt-12 grid grid-cols-1 items-start gap-12 px-4 sm:grid-cols-[1fr,3fr] lg:px-16">
        <div className="flex justify-end h-full">
          <SideNavVereniging
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
