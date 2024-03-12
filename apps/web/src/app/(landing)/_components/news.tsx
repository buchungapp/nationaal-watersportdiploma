import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

import Double from "~/app/_components/brand/double-line";
import { BoxedButton } from "~/app/_components/style/buttons";
import aankondiging from "./_assets/aankondiging.jpg";
import diplomalijn from "./_assets/diplomalijn.jpg";
import zwemvest from "./_assets/zwemvest.png";

export default function News() {
  return (
    <section className="container mx-auto grid gap-20 px-4 lg:px-16">
      <div className="flex flex-col text-center items-center w-full">
        <div className="flex w-full font-bold text-branding-orange uppercase items-center gap-x-3">
          <Double />
          Actueel
          <Double />
        </div>
        <h3 className="text-gray-900 mt-1.5 font-bold text-2xl">De laatste ontwikkelingen.</h3>
        <p className="text-gray-700 mt-2.5 mx-auto max-w-prose">
          We doen super leuke dingen bij het NWD, dus we houden je via deze mega leuk blog op de
          hoogte van alle verhaaltjes en ditjes en datjes die er zijn! Super leuk zeker lezen.
        </p>

        <BoxedButton href="/actueel" className="bg-branding-orange text-white mt-8">
          Meer nieuws
        </BoxedButton>
      </div>
      <div className="grid items-start gap-12 grid-cols-1 lg:grid-cols-3">
        {[
          {
            href: "/actueel/1",
            image: aankondiging,
            title: "Aankondiging Nationaal Watersportdiploma.",
            date: "11 maart 2024",
            description:
              "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
          },
          {
            href: "/actueel/2",
            image: diplomalijn,
            title: "Werk aan de diplomalijnen nagenoeg afgerond.",
            date: "9 maart 2024",
            description:
              "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
          },
          {
            href: "/actueel/3",
            image: zwemvest,
            title: "Zwemvesten, niet hip maar wel noodzakelijk!",
            date: "8 maart 2024",
            description:
              "A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.",
          },
        ].map((news) => (
          <Link key={news.href} href={news.href} className="p-4 rounded-3xl -m-4 hover:bg-gray-100">
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
