import { constants } from "@nawadi/lib";
import { notFound } from "next/navigation";
import { Prose } from "~/app/(public)/_components/prose";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { formatDate } from "~/app/(public)/_utils/format-date";
import { Container } from "~/app/(public)/actueel/(article)/_components/container";
import { getHelpArticles } from "~/lib/article-2";
import { HelpArticle } from "../../_components/article";

export default async function Page({ params }: { params: { slug: string } }) {
  const posts = await getHelpArticles();

  const post = posts.find((article) => article.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.lastUpdatedAt,
            description: post.metadata.summary,
            url: `${constants.WEBSITE_URL}/help/artikel/${post.slug}`,
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
            <h1 className="text-3xl font-bold lg:text-4xl xl:text-5xl">
              {post.metadata.title}
            </h1>
          </div>
        </div>
      </PageHero>
      <Container className="mt-12 lg:mt-16">
        <div className="mx-auto max-w-2xl">
          <article className="flex flex-col gap-y-10">
            <p className="text-gray-500 text-lg">{post.metadata.summary}</p>

            <div className="flex items-center gap-x-4 text-gray-400">
              <span className="h-4 w-0.5 rounded-full bg-zinc-200"></span>
              <span className="flex gap-x-1.5">
                <p>Laatste update</p>

                <time
                  className="font-medium"
                  dateTime={post.metadata.lastUpdatedAt}
                >
                  {formatDate(post.metadata.lastUpdatedAt)}
                </time>
              </span>
            </div>

            <Prose className="-mt-7" data-mdx-content>
              <HelpArticle source={post.content} />
            </Prose>
          </article>
        </div>
      </Container>
    </>
  );
}
