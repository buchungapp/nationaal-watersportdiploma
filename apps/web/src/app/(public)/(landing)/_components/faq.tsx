import Link from "next/link";
import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import { getHelpArticles } from "~/lib/article-2";
import FaqAccordion from "./faq-accordion";

export default async function Faq() {
  const articles = await getHelpArticles().then((articles) =>
    articles
      .filter((x) => x.metadata.isPopulair)
      .sort((a, b) => {
        const dateA = new Date(a.metadata.lastUpdatedAt);
        const dateB = new Date(b.metadata.lastUpdatedAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5),
  );

  const faqItems = articles.map((article) => ({
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
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
          Veelgestelde vragen
        </h2>
      </div>

      <div className="w-full">
        <FaqAccordion
          items={faqItems.map(({ question, answer, slug }) => ({
            question,
            answer,
            link: `/help/artikel/${slug}`,
          }))}
        />
      </div>

      <div className="flex">
        <BoxedButton href="/help" className="bg-branding-dark text-white">
          Bezoek het helpcentrum
        </BoxedButton>
      </div>
    </section>
  );
}
