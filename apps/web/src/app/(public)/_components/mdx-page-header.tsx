"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import PageHero from "~/app/(public)/_components/style/page-hero";
import type { PageWithMeta } from "../../../types";

export default function MdxPageHeader({ pages }: { pages: PageWithMeta[] }) {
  const currentSegments = useSelectedLayoutSegments();

  if (!currentSegments.includes("disciplines")) {
    const normalizedPages = pages.map((page) => ({
      title: page.title,
      segments: [...page.pathSegments, page.slug].filter(Boolean),
      description: page.description,
    }));

    const activePage = normalizedPages.find(
      (page) =>
        currentSegments.length === page.segments.length &&
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

  return (
    <PageHero>
      <div className="px-4 lg:px-16">
        <div className="grid gap-6 text-white">
          <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">
            {"Disciplines"}
          </h1>
        </div>
      </div>
    </PageHero>
  );
}
