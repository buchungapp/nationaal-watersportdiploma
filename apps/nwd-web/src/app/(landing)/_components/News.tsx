import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

import Article from "~/app/_components/style/Article";
import { BoxedButton } from "~/app/_components/style/Buttons";
import aankondiging from "./_assets/aankondiging.jpg";
import diplomalijn from "./_assets/diplomalijn.jpg";
import zwemvest from "./_assets/zwemvest.png";

export default function News() {
  return (
    <section className="grid gap-20 px-4 lg:px-16">
      <Article justify="center">
        <Article.Heading className="text-branding-orange">nieuws</Article.Heading>
        <Article.Title as="h2">De laatste ontwikkelingen.</Article.Title>
        <Article.Paragraph className="max-w-lg">
          We doen super leuke dingen bij het NWD, dus we houden je via deze mega leuk blog op de
          hoogte van alle verhaaltjes en ditjes en datjes die er zijn! Super leuk zeker lezen.
        </Article.Paragraph>
        <Article.ButtonSection className="mt-8">
          <BoxedButton href="/nieuws" className="bg-branding-orange text-white">
            Meer nieuws
          </BoxedButton>
        </Article.ButtonSection>
      </Article>
      <div className="grid items-start gap-12 grid-cols-1 lg:grid-cols-3">
        {[
          {
            href: "/nieuws/1",
            image: aankondiging,
            title: "Aankondiging Nationaal Watersportdiploma.",
            date: "11 maart 2024",
            description:
              "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
          },
          {
            href: "/nieuws/2",
            image: diplomalijn,
            title: "Werk aan de diplomalijnen nagenoeg afgerond.",
            date: "9 maart 2024",
            description:
              "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
          },
          {
            href: "/nieuws/3",
            image: zwemvest,
            title: "Zwemvesten, niet hip maar wel noodzakelijk!",
            date: "8 maart 2024",
            description:
              "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
          },
        ].map((news) => (
          <Link key={news.href} href={news.href}>
            <article className="grid">
              <Image
                src={news.image}
                alt={news.title}
                width={news.image.width}
                height={news.image.height}
                className="rounded-2xl aspect-video object-cover"
              />
              <div className="py-4 grid gap-2">
                <span className="text-branding-dark text-sm">{news.date}</span>
                <h3 className="font-bold text-xl">
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
