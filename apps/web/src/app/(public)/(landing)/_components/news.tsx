import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import Double from "~/app/_components/brand/double-line";
import { formatDate } from "~/app/(public)/_utils/format-date";
import { getAllArticles } from "~/lib/articles";

export default async function News() {
  const articles = await getAllArticles();

  const featuredArticles = articles.slice(0, 3);

  return (
    <section className="mx-auto w-full max-w-(--breakpoint-xl)">
      <div className="grid gap-12">
        <div className="grid gap-3">
          <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
            <span className="whitespace-nowrap">Actueel</span>
            <Double />
          </div>
          <div className="flex items-end justify-between gap-8">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              De laatste ontwikkelingen
            </h3>
            <Link
              href="/actueel"
              className="hidden shrink-0 rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 sm:inline-flex items-center gap-1.5 transition-colors"
            >
              Alle artikelen
              <span aria-hidden="true">{"\u2192"}</span>
            </Link>
          </div>
          <Link
            href="/actueel"
            className="self-start rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 inline-flex items-center gap-1.5 transition-colors sm:hidden"
          >
            Alle artikelen
            <span aria-hidden="true">{"\u2192"}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 lg:grid-cols-3">
          {featuredArticles.map((news) => (
            <Link
              key={news.slug}
              href={`/actueel/${news.slug}`}
              className="group bg-white transition-colors hover:bg-slate-50"
            >
              <article className="grid h-full">
                {news.featuredImage ? (
                  <Image
                    src={news.featuredImage}
                    alt=""
                    width={news.featuredImage.width}
                    height={news.featuredImage.height}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="aspect-video w-full object-cover"
                  />
                ) : null}
                <div className="grid gap-3 p-4 sm:p-6 content-start">
                  <div className="flex items-center gap-x-3">
                    <span className="text-xs font-medium text-slate-400">
                      {formatDate(news.date)}
                    </span>
                    <span className="text-xs font-medium text-slate-400 capitalize">
                      {news.category}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-branding-dark transition-colors">
                    <Balancer>{news.title}</Balancer>
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {news.description}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>


      </div>
    </section>
  );
}
