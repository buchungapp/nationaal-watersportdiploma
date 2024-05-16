import { notFound } from "next/navigation";
import { Prose } from "~/app/(public)/_components/prose";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { formatDate } from "~/app/(public)/_utils/format-date";
import { Container } from "~/app/(public)/actueel/(article)/_components/container";
import { getHelpArticles } from "~/lib/article-2";
import { HelpArticle } from "../../_components/article";

export default function Page({ params }: { params: { slug: string } }) {
  const post = getHelpArticles().find(
    (article) => article.slug === params.slug,
  );

  if (!post) {
    notFound();
  }

  return (
    <>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">
              {post.metadata.title}
            </h1>
          </div>
        </div>
      </PageHero>
      <Container className="mt-16 lg:mt-24">
        <div className="mx-auto max-w-2xl">
          <article>
            <div className="flex items-center gap-x-4 text-gray-400">
              <span className="h-4 w-0.5 rounded-full bg-zinc-200"></span>
              <span className="flex gap-x-1.5">
                <p>Laatste update:</p>

                <time dateTime={post.metadata.publishedAt as string}>
                  {formatDate(post.metadata.publishedAt as string)}
                </time>
              </span>
            </div>

            <Prose className="mt-8" data-mdx-content>
              <HelpArticle source={post.content} />
            </Prose>
          </article>
        </div>
      </Container>
    </>
  );
}
