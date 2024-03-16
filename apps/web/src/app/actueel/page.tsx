import { getAllArticles } from "~/lib/articles";
import Article from "../_components/style/article";
import { TekstButton } from "../_components/style/buttons";
import PageHero from "../_components/style/page-hero";
import SideNav from "../_components/style/side-nav";

export default async function Actueel() {
  const articles = await getAllArticles();

  return (
    <main>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              Actueel
            </h1>
            <p className="text-xl">
              Blijf op de hoogte van het laatste nieuws en vereniging updates.
            </p>
          </div>
        </div>
      </PageHero>
      <div className="mt-12 grid grid-cols-1 gap-12 px-4 sm:grid-cols-[1fr,3fr] lg:px-16">
        <div className="flex justify-end">
          <SideNav
            label="Filter"
            items={[
              {
                label: "Vereniging",
                href: "/actueel?filter=vereniging",
              },
              {
                label: "Consumenten",
                href: "/actueel?filter=consumenten",
              },
              {
                label: "Instructeurs",
                href: "/actueel?filter=instructeurs",
              },
              {
                label: "Techniek",
                href: "/actueel?filter=techniek",
              },
            ]}
            className="w-full sm:w-[18rem]"
          />
        </div>
        <div className="flex flex-col justify-center gap-16">
          {articles.map((article) => (
            <div
              key={article.slug}
              className="grid gap-2 sm:grid-cols-[12rem,1fr]"
            >
              <p className="text-xs text-gray-400">{article.date}</p>
              <Article className="max-w-xl">
                <Article.Heading className="text-xs font-normal text-gray-400">
                  TODO
                </Article.Heading>
                <Article.Title>{article.title}</Article.Title>
                <Article.Paragraph className="text-gray-700">
                  {article.description}
                </Article.Paragraph>

                <TekstButton
                  href={`/actueel/${article.slug}`}
                  className={"mt-4 text-branding-orange"}
                >
                  Lees meer
                </TekstButton>
              </Article>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
