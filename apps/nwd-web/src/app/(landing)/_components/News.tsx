import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import Double from "~/app/_assets/Double";

import aankondiging from "./_assets/aankondiging.jpg";
import diplomalijn from "./_assets/diplomalijn.jpg";
import zwemvest from "./_assets/zwemvest.png";

export default function News() {
  return (
    <section className="grid gap-20 px-4 lg:px-16">
      <article className="flex flex-col items-center gap-10">
        <div className="flex flex-col gap-2 w-full">
          <div className={"flex gap-3 items-center text-branding-orange"}>
            <Double />
            <span className="uppercase whitespace-nowrap font-bold">Nieuws</span>
            <Double />
          </div>
          <h2 className="font-bold text-2xl text-center">
            <Balancer>De laatste ontwikkelingen.</Balancer>
          </h2>
          <p className="text-center max-w-lg self-center">
            We doen super leuke dingen bij het NWD, dus we houden je via deze mega leuk blog op de
            hoogte van alle verhaaltjes en ditjes en datjes die er zijn! Super leuk zeker lezen.
          </p>
        </div>
        <Link
          href="/nieuws"
          className="text-white bg-branding-orange group text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
        >
          Meer nieuws{" "}
          <ArrowLongRightIcon
            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
            strokeWidth={2.5}
          />
        </Link>
      </article>
      <div className="grid items-start gap-12 grid-cols-1 lg:grid-cols-3">
        <Link href="/nieuws/1">
          <article className="grid">
            <Image
              src={aankondiging}
              alt="Aankondiging Nationaal Watersportdiploma."
              width={aankondiging.width}
              height={aankondiging.height}
              className="rounded-2xl aspect-video object-cover"
            />
            <div className="py-4 grid gap-2">
              <span className="text-branding-dark text-sm">11 maart 2024</span>
              <h3 className="font-bold text-xl">
                <Balancer>Aankondiging Nationaal Watersportdiploma.</Balancer>
              </h3>
              <p className="text-slate-700">
                A simple rule to calculate line height is 1.5x font size. However, this is not cast
                in stone and you are free to titrate.
              </p>
            </div>
          </article>
        </Link>
        <Link href="/nieuws/2">
          <article className="grid">
            <Image
              src={diplomalijn}
              alt="Werk aan de diplomalijnen nagenoeg afgerond."
              width={diplomalijn.width}
              height={diplomalijn.height}
              className="rounded-2xl aspect-video object-cover"
            />
            <div className="py-4 grid gap-2">
              <span className="text-branding-dark text-sm">9 maart 2024</span>
              <h3 className="font-bold text-xl">
                <Balancer>Werk aan de diplomalijnen nagenoeg afgerond.</Balancer>
              </h3>
              <p className="text-slate-700">
                A simple rule to calculate line height is 1.5x font size. However, this is not cast
                in stone and you are free to titrate.
              </p>
            </div>
          </article>
        </Link>
        <Link href="/nieuws/3">
          <article className="grid">
            <Image
              src={zwemvest}
              alt="Zwemvesten, niet hip maar wel noodzakelijk!"
              width={zwemvest.width}
              height={zwemvest.height}
              className="rounded-2xl aspect-video object-cover"
            />
            <div className="py-4 grid gap-2">
              <span className="text-branding-dark text-sm">8 maart 2024</span>
              <h3 className="font-bold text-xl">
                <Balancer>Zwemvesten, niet hip maar wel noodzakelijk!</Balancer>
              </h3>
              <p className="text-slate-700">
                A simple rule to calculate line height is 1.5x font size. However, this is not cast
                in stone and you are free to titrate.
              </p>
            </div>
          </article>
        </Link>
      </div>
    </section>
  );
}
