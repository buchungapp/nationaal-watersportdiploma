import { APP_NAME } from "@nawadi/lib/constants";

import type { Metadata } from "next";
import MdxPageHeader from "~/app/_components/mdx-page-header";
import { Prose } from "~/app/_components/prose";
import { getAllDiplomalijnConsumentenPages } from "~/lib/mdx-pages";
import SideNavVereniging from "./_components/side-nav";

export const metadata: Metadata = {
  title: {
    template: `%s | Diplomalijn Consumenten | ${APP_NAME}`,
    default: `Diplomalijn Consumenten | ${APP_NAME}`,
  },
};

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pages = await getAllDiplomalijnConsumentenPages();

  return (
    <main>
      <MdxPageHeader pages={pages} />
      <div className="mt-12 grid grid-cols-1 items-start gap-12 px-4 sm:grid-cols-[1fr,3fr] lg:px-16">
        <div className="flex justify-end h-full">
          <SideNavVereniging
            pages={{
              general: pages.filter((page) => page.pathSegments.length === 0),
              disciplines: pages.filter(
                (page) =>
                  page.pathSegments.length > 0 &&
                  page.pathSegments.includes("disciplines"),
              ),
            }}
          />
        </div>
        <div className="flex flex-col justify-center">
          <Prose data-mdx-content>{children}</Prose>
        </div>
      </div>
    </main>
  );
}
