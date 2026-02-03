import { constants } from "@nawadi/lib";
import Image from "next/image";
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
        // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional
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
        <div className="grid grid-cols-1 items-center gap-8 px-4 lg:grid-cols-2 lg:px-16 min-w-0">
          <div
            className={`grid gap-6 text-white min-w-0 ${!article.featuredImage ? "lg:col-span-2" : ""}`}
          >
            <TekstButton backwards href="/actueel" className="text-white">
              Terug naar alle artikelen
            </TekstButton>

            <h1 className="text-3xl font-bold lg:text-4xl break-words min-w-0 overflow-hidden">
              {article.title}
            </h1>
          </div>
          {article.featuredImage && (
            <div className="relative aspect-[1.91/1] w-full overflow-hidden rounded-3xl border-2 border-white/20 shadow-lg">
              <Image
                src={article.featuredImage}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </PageHero>
      <Container className="mt-16 lg:mt-24">
        <div className="mx-auto max-w-2xl">
          <article>
            <div className="flex items-center gap-x-4 text-slate-400">
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
