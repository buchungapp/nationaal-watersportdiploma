import { constants } from "@nawadi/lib";
import { Prose } from "~/app/(public)/_components/prose";
import { TekstButton } from "~/app/(public)/_components/style/buttons";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { formatDate } from "~/app/(public)/_utils/format-date";
import type { ArticleWithSlug } from "~/lib/articles";
import { Container } from "./container";

export function ArticleLayout({
  article,
  children,
}: {
  article: ArticleWithSlug;
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            datePublished: article.date,
            dateModified: article.date,
            description: article.description,
            url: `${constants.WEBSITE_URL}/actueel/${article.slug}`,
            author: {
              "@type": "Organization",
              name: "Nationaal Watersportdiploma",
              url: constants.WEBSITE_URL,
            },
          }),
        }}
      />

      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <TekstButton backwards href="/actueel" className="text-white">
              Terug naar alle artikelen
            </TekstButton>

            <h1 className="text-4xl font-bold lg:leading-[1.15] lg:text-5xl max-w-prose break-words hyphens-auto">
              {article.title}
            </h1>
          </div>
        </div>
      </PageHero>
      <Container className="mt-16 lg:mt-24">
        <div className="mx-auto max-w-2xl">
          <article>
            <div className="flex items-center gap-x-4 text-gray-400">
              <span className="h-4 w-0.5 rounded-full bg-zinc-200" />
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              <span className="text-xl leading-4">&middot;</span>
              <span className="capitalize">{article.category}</span>
            </div>

            <Prose className="mt-8" data-mdx-content>
              {children}
            </Prose>
          </article>
        </div>
      </Container>
    </>
  );
}
