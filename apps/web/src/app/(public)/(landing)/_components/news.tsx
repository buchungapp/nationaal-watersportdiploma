import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import { formatDate } from "~/app/(public)/_utils/format-date";
import Double from "~/app/_components/brand/double-line";
import { getAllArticles } from "~/lib/articles";

export default async function News() {
  const articles = await getAllArticles();

  const featuredArticles = articles.slice(0, 3);

  return (
    <section className="container mx-auto grid gap-20 px-4 lg:px-16">
      <div className="flex w-full flex-col items-center text-center">
        <div className="flex w-full items-center gap-x-3 font-bold uppercase text-branding-orange">
          <Double />
          Actueel
          <Double />
        </div>
        <h3 className="mt-1.5 text-2xl font-bold text-slate-900">
          De laatste ontwikkelingen.
        </h3>
        <p className="mx-auto mt-2.5 max-w-prose text-slate-700">
          Lees aankondigingen, updates en nieuws over het Nationaal
          Watersportdiploma. Of je nou consument, instructeur of
          vaarschoolhouder bent, hier vind je het laatste ontwikkelingen.
        </p>

        <BoxedButton
          href="/actueel"
          className="mt-8 bg-branding-orange text-white"
        >
          Meer nieuws
        </BoxedButton>
      </div>
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-3">
        {featuredArticles.map((news) => (
          <Link
            key={news.slug}
            href={`/actueel/${news.slug}`}
            className="-m-4 rounded-3xl p-4 transition-colors hover:bg-slate-100"
          >
            <article className="grid">
              {news.featuredImage ? (
                <Image
                  src={news.featuredImage}
                  alt={""}
                  width={news.featuredImage.width}
                  height={news.featuredImage.height}
                  placeholder="blur"
                  className="aspect-video rounded-2xl object-cover"
                />
              ) : null}
              <div className="grid gap-2 py-4">
                <div className="flex items-center gap-x-4">
                  <span className="text-sm text-branding-dark">
                    {formatDate(news.date)}
                  </span>
                  <span className="text-sm text-slate-400 capitalize">
                    {news.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold">
                  <Balancer>{news.title}</Balancer>
                </h3>
                <p className="text-slate-700">{news.description}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
