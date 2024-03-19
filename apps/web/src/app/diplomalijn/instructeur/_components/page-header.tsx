"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import PageHero from "~/app/_components/style/page-hero";

export default function PageHeader({
  pages,
}: {
  pages: {
    label: string;
    slug: string | null;
    description?: React.ReactNode;
  }[];
}) {
  const currentSegments = useSelectedLayoutSegments();

  const activePage = pages.find((page) => {
    // This is quite a hacky way to check things, maybe we should
    // consider using the same isActive function as the SideNav
    if (currentSegments.length === 0 && page.slug === null) return true;

    if (!page.slug) return false;

    return currentSegments.includes(page.slug);
  });

  return (
    <PageHero>
      <div className="px-4 lg:px-16">
        <div className="grid gap-6 text-white">
          <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">
            {activePage?.label ?? "Instructeur"}
          </h1>
          {activePage?.description ? (
            <p className="text-xl">{activePage.description}</p>
          ) : null}
        </div>
      </div>
    </PageHero>
  );
}
