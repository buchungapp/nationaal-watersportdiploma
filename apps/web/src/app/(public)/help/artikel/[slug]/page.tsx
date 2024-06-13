import { LinkIcon, PrinterIcon } from "@heroicons/react/24/solid";
import { constants } from "@nawadi/lib";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyToClipboard from "~/app/(public)/_components/copy-to-clipboard-simple";
import { FindNWDCourse } from "~/app/(public)/_components/cta";
import PrintPage from "~/app/(public)/_components/print-page";
import { Prose } from "~/app/(public)/_components/prose";
import {
  LinkedIn,
  Whatsapp,
  Twitter as X,
} from "~/app/(public)/_components/socials";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import { formatDate } from "~/app/(public)/_utils/format-date";
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
  const [post, relatedArticles, categories] = await Promise.all([
    findPost(params.slug),
    getHelpArticles().then((articles) =>
      articles.filter((x) => x.slug !== params.slug),
    ),
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

      <div className="grid lg:grid-cols-3 gap-x-8 gap-y-6">
        <div className="lg:col-span-2">
          <article className="flex flex-col gap-y-10">
            <div className="">
              <h1 className="text-3xl font-bold lg:text-4xl text-branding-dark break-words hyphens-auto">
                {post.metadata.title}
              </h1>
              <p className="text-lg/6 text-gray-800 mt-4 text-justify break-words hyphens-auto">
                {post.metadata.summary}
              </p>
            </div>

            <div className="flex items-center gap-x-4 text-gray-500">
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

        <div className="flex flex-col divide-y divide-gray-200 space-y-8 lg:border-l lg:border-gray-200 lg:pl-6">
          {/* Related articles */}
          <div className="grid gap-4">
            <h2 className="text-gray-600 text-sm font-semibold">Gerelateerd</h2>
            <ul className="space-y-3.5 -mx-4">
              {relatedArticles
                .filter((article) => article.category !== "vereniging")
                .slice(0, 3)
                .map((article) => (
                  <li key={article.slug}>
                    <BoxedButton
                      href={`/help/artikel/${article.slug}`}
                      className="text-branding-dark"
                    >
                      <p className="text-sm/5 font-semibold">
                        {article.metadata.title}
                      </p>
                    </BoxedButton>
                  </li>
                ))}
            </ul>
          </div>

          {/* Socials */}
          <div className="grid gap-4 pt-8">
            <h2 className="text-gray-600 text-sm font-semibold">
              Deel dit artikel
            </h2>
            <ul className="flex items-center gap-x-5">
              {/* WhatsApp */}
              <li>
                <Link
                  href={`https://wa.me/?text=${encodeURIComponent(`Lees: ${post.metadata.title} via ${constants.WEBSITE_URL}/help/artikel/${post.slug}`)}`}
                  title="Deel via WhatsApp"
                  target="_blank"
                >
                  <Whatsapp className="text-branding-dark h-5 w-5" />
                </Link>
              </li>

              {/* LinkedIn */}
              <li>
                <Link
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${constants.WEBSITE_URL}/help/artikel/${post.slug}`)}&title=${encodeURIComponent(post.metadata.title)}&summary=${encodeURIComponent(post.metadata.summary)}&source=${encodeURIComponent(constants.WEBSITE_URL)}`}
                  title="Deel via LinkedIn"
                  target="_blank"
                >
                  <LinkedIn className="text-branding-dark h-5 w-5" />
                </Link>
              </li>

              {/* X */}
              <li>
                <Link
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Lees: ${post.metadata.title} via ${constants.WEBSITE_URL}/help/artikel/${post.slug}`)}`}
                  title="Deel via X"
                  target="_blank"
                >
                  <X className="text-branding-dark h-5 w-5" />
                </Link>
              </li>

              {/* Copy link */}
              <li>
                <CopyToClipboard
                  copyValue={`${constants.WEBSITE_URL}/help/artikel/${post.slug}`}
                >
                  <LinkIcon className="h-5 w-5 text-branding-dark" />
                </CopyToClipboard>
              </li>

              {/* Print */}
              <li>
                <PrintPage>
                  <PrinterIcon className="h-5 w-5 text-branding-dark" />
                </PrintPage>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <FindNWDCourse />
    </>
  );
}
