import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import { formatDate } from "~/app/(public)/_utils/format-date";
import { getAllArticles } from "~/lib/articles";

export default async function News() {
  const articles = await getAllArticles();

  const featuredArticles = articles.slice(0, 3);

  return (
    <section className="rounded-[3rem] bg-slate-950 px-4 py-16 lg:px-16 lg:py-24">
      <div className="container mx-auto grid gap-12">
        <div className="flex items-end justify-between gap-8">
          <div className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Actueel
            </span>
            <h3 className="text-2xl font-bold text-white sm:text-3xl">
              De laatste ontwikkelingen
            </h3>
          </div>
          <BoxedButton
            href="/actueel"
            className="hidden shrink-0 border border-slate-700 text-white hover:bg-slate-800 sm:inline-flex"
          >
            Alle artikelen
          </BoxedButton>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 lg:grid-cols-3">
          {featuredArticles.map((news) => (
            <Link
              key={news.slug}
              href={`/actueel/${news.slug}`}
              className="group bg-slate-950 transition-colors hover:bg-slate-900"
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
                <div className="grid gap-3 p-6 content-start">
                  <div className="flex items-center gap-x-3">
                    <span className="text-xs font-medium text-slate-500">
                      {formatDate(news.date)}
                    </span>
                    <span className="text-xs font-medium text-slate-600 capitalize">
                      {news.category}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white leading-snug group-hover:text-branding-orange transition-colors">
                    <Balancer>{news.title}</Balancer>
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                    {news.description}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="flex justify-center sm:hidden">
          <BoxedButton
            href="/actueel"
            className="border border-slate-700 text-white hover:bg-slate-800"
          >
            Alle artikelen
          </BoxedButton>
        </div>
      </div>
    </section>
  );
}
