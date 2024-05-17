import { constants } from "@nawadi/lib";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prose } from "~/app/(public)/_components/prose";
import PageHero from "~/app/(public)/_components/style/page-hero";
import { formatDate } from "~/app/(public)/_utils/format-date";
import { Container } from "~/app/(public)/actueel/(article)/_components/container";
import { getHelpArticles, getHelpCategories } from "~/lib/article-2";
import { HelpArticle } from "../../_components/article";
import Breadcrumb from "../../_components/breadcrumb";

// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
  const posts = await getHelpArticles();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

async function findPost(slug: string) {
  const posts = await getHelpArticles();

  return posts.find((article) => article.slug === slug);
}

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await findPost(params.slug);

  if (!post) {
    notFound();
  }

  return {
    title: `${post.metadata.title}`,
    description: post.metadata.summary,
    alternates: {
      canonical: `/help/artikel/${post.slug}`,
    },
    openGraph: {
      title: `${post.metadata.title}`,
      type: "article",
      url: `/help/artikel/${post.slug}`,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(post.metadata.title)}${post.metadata.summary ? `&description=${encodeURIComponent(post.metadata.summary)}` : ""}`,
          width: 1200,
          height: 630,
          alt: post.metadata.title,
        },
      ],
    },
  };
}

export default async function Page({ params }: Props) {
  const [post, categories] = await Promise.all([
    findPost(params.slug),
    getHelpCategories(),
  ]);

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
            <Breadcrumb
              items={[
                { label: "Alle categorieën", href: "/help" },
                {
                  label:
                    categories.find((x) => x.slug === post.category)?.title ??
                    post.category,
                  href: `/help/categorie/${post.category}`,
                },
                {
                  label: post.metadata.title,
                  href: `/help/artikel/${post.slug}`,
                },
              ]}
            />
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
