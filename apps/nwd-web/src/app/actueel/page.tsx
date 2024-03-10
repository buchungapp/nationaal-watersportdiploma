import Article from "../_components/style/Article";
import { TekstButton } from "../_components/style/Buttons";
import SideNav from "../_components/style/SideNav";
import PageHero from "../_components/style/page-hero";

export default function Actueel() {
  return (
    <main>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="text-white grid gap-6">
            <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl max-w-lg">Actueel</h1>
            <p className="text-xl">
              Blijf op de hoogte van het laatste nieuws en vereniging updates.
            </p>
          </div>
        </div>
      </PageHero>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr,3fr] gap-12 mt-12 px-4 lg:px-16">
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
                label: "Instruteurs",
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
        <div className="flex flex-col gap-16 justify-center">
          {[
            {
              href: "/nieuws/1",
              title: "Aankondiging Nationaal Watersportdiploma.",
              type: "vereniging",
              date: "11 maart 2024",
              description:
                "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
            },
            {
              href: "/nieuws/2",
              title: "Werk aan de diplomalijnen nagenoeg afgerond.",
              type: "vereniging",
              date: "9 maart 2024",
              description:
                "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
            },
            {
              href: "/nieuws/3",
              title: "Zwemvesten, niet hip maar wel noodzakelijk!",
              type: "vereniging",
              date: "8 maart 2024",
              description:
                "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
            },
          ].map((news) => (
            <div key={news.href} className="grid sm:grid-cols-[12rem,1fr] gap-2">
              <p className="text-slate-400 text-xs">{news.date}</p>
              <Article className="max-w-xl">
                <Article.Heading className="text-slate-400 text-xs font-normal">
                  {news.type}
                </Article.Heading>
                <Article.Title>{news.title}</Article.Title>
                <Article.Paragraph className="text-slate-700">{news.description}</Article.Paragraph>

                <TekstButton href={news.href} className={"mt-4 text-branding-orange"}>
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
