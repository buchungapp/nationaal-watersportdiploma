import Link from "next/link";
import Double from "~/app/_components/brand/double-line";
import { getHelpArticles, getHelpFaqs } from "~/lib/article-2";
import FaqAccordion from "./faq-accordion";
import FaqSearch from "./faq-search";

export default async function Faq() {
  const [allArticles, questions] = await Promise.all([
    getHelpArticles(),
    getHelpFaqs(),
  ]);

  const popularArticles = allArticles
    .filter((x) => x.metadata.isPopulair)
    .sort((a, b) => {
      const dateA = new Date(a.metadata.lastUpdatedAt);
      const dateB = new Date(b.metadata.lastUpdatedAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const faqItems = popularArticles.map((article) => ({
    question: article.metadata.title,
    answer: article.metadata.summary,
    slug: article.slug,
  }));

  return (
    <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 lg:gap-12">
      {/* Header */}
      <div className="grid gap-3">
        <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
          <span className="whitespace-nowrap">Al je vragen beantwoord</span>
          <Double />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
          Veelgestelde vragen
        </h2>
      </div>

      {/* Two-column: FAQ content + support card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12 items-start">
        {/* Left: search + accordion */}
        <div className="grid gap-8">
          <FaqSearch questions={questions} articles={allArticles} />
          <FaqAccordion
            items={faqItems.map(({ question, answer, slug }) => ({
              question,
              answer,
              link: `/help/artikel/${slug}`,
            }))}
          />
        </div>

        {/* Right: sticky support card */}
        <div className="hidden lg:block lg:sticky lg:top-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 grid gap-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-branding-dark/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-5 text-branding-dark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <div className="grid gap-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Kun je het antwoord niet vinden?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Zoek verder in ons helpcentrum of neem direct contact op. We
                helpen je graag.
              </p>
            </div>
            <Link
              href="/help"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-branding-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-branding-dark/90"
            >
              Naar het helpcentrum
              <span aria-hidden="true">{"\u2192"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile support link (shown below accordion on small screens) */}
      <Link
        href="/help"
        className="self-start rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 inline-flex items-center gap-1.5 transition-colors lg:hidden"
      >
        Naar het helpcentrum
        <span aria-hidden="true">{"\u2192"}</span>
      </Link>
    </section>
  );
}
