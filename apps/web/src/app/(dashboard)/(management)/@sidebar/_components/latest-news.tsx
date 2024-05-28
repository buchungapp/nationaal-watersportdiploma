import { Suspense } from "react";
import { getAllArticles } from "~/lib/articles";
import {
  SidebarHeading,
  SidebarItem,
  SidebarSection,
} from "../../../_components/sidebar";

async function LatestNewsList() {
  const articles = await getAllArticles();

  return (
    <SidebarSection className="max-lg:hidden">
      <SidebarHeading>Laatste nieuws</SidebarHeading>
      {articles.slice(0, 3).map((article) => (
        <SidebarItem
          key={article.id}
          href={`/actueel/${article.slug}`}
          target="_blank"
          title={article.title}
          className="*:truncate *:inline-block"
        >
          {article.title}
        </SidebarItem>
      ))}
    </SidebarSection>
  );
}

export default function LatestNews() {
  return (
    <Suspense fallback={null}>
      <LatestNewsList />
    </Suspense>
  );
}
