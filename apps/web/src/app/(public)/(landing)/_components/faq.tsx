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
    <section className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-12">
      <div className="grid gap-3">
        <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
          <span className="whitespace-nowrap">Al je vragen beantwoord</span>
          <Double />
        </div>
        <div className="flex items-end justify-between gap-8">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
            Veelgestelde vragen
          </h2>
          <Link
            href="/help"
            className="hidden shrink-0 rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 sm:inline-flex items-center gap-1.5 transition-colors"
          >
            Naar het helpcentrum
            <span aria-hidden="true">{"\u2192"}</span>
          </Link>
        </div>
        <Link
          href="/help"
          className="self-start rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 inline-flex items-center gap-1.5 transition-colors sm:hidden"
        >
          Naar het helpcentrum
          <span aria-hidden="true">{"\u2192"}</span>
        </Link>
      </div>

      <div className="w-full max-w-3xl">
        <FaqSearch questions={questions} articles={allArticles} />
      </div>

      <div className="w-full max-w-3xl">
        <FaqAccordion
          items={faqItems.map(({ question, answer, slug }) => ({
            question,
            answer,
            link: `/help/artikel/${slug}`,
          }))}
        />
      </div>


    </section>
  );
}
