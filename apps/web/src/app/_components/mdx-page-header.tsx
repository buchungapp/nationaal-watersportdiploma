"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import PageHero from "~/app/_components/style/page-hero";
import type { LayoutSegment } from "../types";

export default function MdxPageHeader({
  layoutSegments,
}: {
  layoutSegments: LayoutSegment[];
}) {
  const currentSegments = useSelectedLayoutSegments();

  const activePage = layoutSegments
    .flatMap(({ parentSegments, pages }) =>
      pages.map((page) => ({
        title: page.title,
        segments: [...parentSegments, page.slug].filter(Boolean) as string[],
        description: page.description,
      })),
    )
    .find((page) =>
      currentSegments.every(
        (segment, index) => page.segments[index] === segment,
      ),
    );

  if (!activePage) {
    throw new Error("No active page found");
  }

  return (
    <PageHero>
      <div className="px-4 lg:px-16">
        <div className="grid gap-6 text-white">
          <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">
            {activePage.title}
          </h1>
          {activePage.description ? (
            <p className="text-xl">{activePage.description}</p>
          ) : null}
        </div>
      </div>
    </PageHero>
  );
}
