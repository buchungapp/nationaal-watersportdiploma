import { Prose } from "~/app/(public)/_components/prose";
import { TekstButton } from "~/app/(public)/_components/style/buttons";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { formatDate } from "~/app/(public)/_utils/format-date";
import type { HelpArticleWithSlug } from "~/lib/help-articles";
import { Container } from "./container";

export function ArticleLayout({
  article,
  children,
}: {
  article: HelpArticleWithSlug;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <TekstButton backwards href="/helpcentrum" className="text-white">
              Terug naar alle artikelen
            </TekstButton>

            <h1 className="text-4xl font-bold lg:leading-[1.15] lg:text-5xl max-w-prose">
              {article.title}
            </h1>
          </div>
        </div>
      </PageHero>
      <Container className="mt-16 lg:mt-24">
        <div className="mx-auto max-w-2xl">
          <article>
            <div className="flex items-center gap-x-4 text-gray-400">
              <span className="h-4 w-0.5 rounded-full bg-zinc-200"></span>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
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
