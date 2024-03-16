import { Suspense } from "react";
import Article from "~/app/_components/style/article";
import { BoxedButton } from "~/app/_components/style/buttons";
import { listFaqs } from "~/lib/faqs";

export default async function Faq() {
  const questions = listFaqs({ filter: { featured: true } });

  return (
    <section className="container mx-auto grid gap-20 px-4 lg:px-16">
      <Article>
        <Article.Heading className="text-branding-dark">
          Hoe zit het
        </Article.Heading>
        <Article.Title as="h2">Veelgestelde vragen.</Article.Title>
        <Article.Paragraph>
          Het NWD is nieuw, dus het is niet gek dat dit wat vragen bij je
          oproept. Daarom zetten wij alvast een aantal van de meestgestelde
          vragen voor je op een rijtje.
        </Article.Paragraph>
        <Article.ButtonSection className="mt-8">
          <BoxedButton
            href="/helpcentrum"
            className="bg-branding-dark text-white"
          >
            Bekijk alle vragen
          </BoxedButton>
        </Article.ButtonSection>
      </Article>
      <Suspense>
        <div
          className="columns-1 gap-8 space-y-12 lg:columns-3 xl:space-y-12"
          style={{
            columnFill: "balance",
          }}
        >
          {(await questions).map(({ question, answer }) => (
            <div
              key={question}
              className="grid break-inside-avoid-column gap-4"
            >
              <h4 className="text-lg font-semibold text-branding-dark">
                {question}
              </h4>
              <div
                className="text-justify text-gray-700"
                dangerouslySetInnerHTML={{ __html: answer }}
              />
            </div>
          ))}
        </div>
      </Suspense>
    </section>
  );
}
