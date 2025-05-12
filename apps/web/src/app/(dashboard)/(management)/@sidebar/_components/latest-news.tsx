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
          className="*:inline-block *:truncate"
        >
          {article.title}
        </SidebarItem>
      ))}
    </SidebarSection>
  );
}

function LatestNewsFallback() {
  return (
    <SidebarSection className="max-lg:hidden">
      <SidebarHeading>Laatste nieuws</SidebarHeading>
      {[1, 2, 3].map((i) => (
        <SidebarItem key={`news-fallback-${i}`} href="#" disabled>
          <span
            className="inline-block bg-gray-300 rounded w-full h-4.5 animate-pulse"
            style={{
              animationDelay: `${i * 0.3}s`,
            }}
          />
        </SidebarItem>
      ))}
    </SidebarSection>
  );
}

export default function LatestNews() {
  return (
    <Suspense fallback={<LatestNewsFallback />}>
      <LatestNewsList />
    </Suspense>
  );
}
