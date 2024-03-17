"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import PageHero from "~/app/_components/style/page-hero";

export default function PageHeader({
  pages,
}: {
  pages: { label: string; slug: string; description?: React.ReactNode }[];
}) {
  const currentSegment = useSelectedLayoutSegment();

  const activePage = pages.find((page) => page.slug === currentSegment);

  return (
    <PageHero>
      <div className="px-4 lg:px-16">
        <div className="grid gap-6 text-white">
          <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">
            {activePage?.label ?? "Verenigingszaken"}
          </h1>
          {activePage?.description ? (
            <p className="text-xl">{activePage.description}</p>
          ) : null}
        </div>
      </div>
    </PageHero>
  );
}
