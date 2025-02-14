import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import Double from "~/app/_components/brand/double-line";
import { getHelpArticles } from "~/lib/article-2";

export default async function Faq() {
  const articles = await getHelpArticles().then((articles) =>
    articles
      .filter((x) => x.metadata.isPopulair)
      .sort((a, b) => {
        // sort on lastUpdatedAt
        const dateA = new Date(a.metadata.lastUpdatedAt);
        const dateB = new Date(b.metadata.lastUpdatedAt);
        return dateB.getTime() - dateA.getTime();
      }),
  );

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const featuredArticle = articles.shift()!;

  return (
    <section className="container mx-auto grid gap-20 px-4 lg:px-16">
      <div className="flex w-full flex-col">
        <div className="flex w-full whitespace-nowrap items-center gap-x-3 font-bold uppercase text-branding-dark">
          Hoe zit het?
          <Double />
        </div>
        <h3 className="mt-1.5 text-2xl font-bold text-gray-900">Helpcentrum</h3>
        <p className="mt-2.5 max-w-prose text-gray-700">
          Het NWD is nieuw, dus het is niet gek dat dit wat vragen bij je
          oproept. De artikelen in ons helpcentrum helpen je op weg.
        </p>

        <BoxedButton href="/help" className="mt-8 bg-branding-dark text-white">
          Bezoek het helpcentrum
        </BoxedButton>
      </div>

      <div className="bg-white">
        <div className="mx-auto grid grid-cols-1 gap-x-8 gap-y-12 sm:gap-y-16 lg:grid-cols-2">
          <article className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-lg">
            <h2
              id="featured-post"
              className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              {featuredArticle.metadata.title}
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              {featuredArticle.metadata.summary}
            </p>
            <div className="mt-4 flex flex-col justify-between gap-6 sm:mt-8 sm:flex-row-reverse sm:gap-8 lg:mt-4 lg:flex-col">
              <div className="flex">
                <a
                  href={`/help/artikel/${featuredArticle.slug}`}
                  className="text-sm font-semibold leading-6 text-branding-dark"
                  aria-describedby="featured-post"
                >
                  Verder lezen <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </article>
          <div className="mx-auto w-full max-w-2xl border-t border-gray-900/10 pt-12 sm:pt-16 lg:mx-0 lg:max-w-none lg:border-t-0 lg:pt-0">
            <div className="-my-12 divide-y divide-gray-900/10">
              {articles.map((article) => (
                <article key={article.slug} className="py-12">
                  <div className="group relative max-w-xl">
                    <h2 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-gray-600">
                      <a href={`/help/artikel/${article.slug}`}>
                        <span className="absolute inset-0" />
                        {article.metadata.title}
                      </a>
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-gray-600">
                      {article.metadata.summary}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
