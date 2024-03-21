import Image from "next/image";
import PageHero from "~/app/_components/style/page-hero";
import CopyToClipboard from "../_components/style/copy-to-clipboard";
import SideNav from "../_components/style/side-nav";
import icon from "./_assets/NWD-logo-final.svg";
import lint from "./_assets/combined-lint-final.png";
import wordmark from "./_assets/wordmark-final.svg";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merk",
  description:
    "Alles over het logo, de kleuren en de huisstijl van het Nationaal Watersportdiploma.",
};

export default function Page() {
  return (
    <main>
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="text-4xl font-bold lg:text-5xl xl:text-6xl">Merk</h1>
            Alles over ons logo, kleuren en onze huisstijl.
          </div>
        </div>
      </PageHero>
      <div className="mt-12 grid grid-cols-1 items-start gap-12 px-4 sm:grid-cols-[1fr,3fr] lg:px-16">
        <div className="flex h-full justify-end">
          <SideNav
            sections={[
              {
                label: "Merk",
                items: [
                  {
                    label: "Naam",
                    href: "#naam",
                  },
                  {
                    label: "Logo",
                    href: "#logo",
                  },
                  {
                    label: "Kleuren",
                    href: "#kleuren",
                  },
                  {
                    label: "Lettertype",
                    href: "#lettertype",
                  },
                ],
              },
            ]}
            className="w-full sm:w-[18rem]"
          />
        </div>
        <div className="flex flex-col justify-center">
          <div className="prose max-w-prose">
            <section id="naam" className="scroll-mt-[140px]">
              <h2>Naam</h2>
              <p>
                "Nationaal Watersportdiploma" zijn twee woorden, altijd met een
                hoofdletter "N" en "W". Het is de merknaam van zowel onze
                vereniging als van de diplomalijn. Zodra het gehele woord een
                keer genoemd is, mag het afgekort worden naar "NWD" (volledig in
                hoofdletters).
              </p>
            </section>

            <section id="logo" className="scroll-mt-[140px]">
              <h2>Logo</h2>
              <p>
                Het logo van het Nationaal Watersportdiploma bestaat uit een
                icoon, een woordmerk en een combinatie van beide.
              </p>

              <h3>Icoon</h3>
              {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
              <Image className="rounded-none" src={icon} alt="" width={300} />

              <h3>Woordmerk</h3>
              <Image
                className="rounded-none"
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                src={wordmark}
                alt=""
                width={300}
              />

              <h3>Gecombineerd</h3>
              <Image className="rounded-none" src={lint} alt="" width={300} />
            </section>

            <section id="kleuren" className="scroll-mt-[140px]">
              <h2>Kleuren</h2>
              <p>
                De kleuren van het Nationaal Watersportdiploma zijn oranje,
                lichtblauw en donkerblauw. Deze kleuren worden gebruikt in het
                logo, de huisstijl en op de website.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <h3>Oranje</h3>
                  <div className="w-fit">
                    <CopyToClipboard
                      className="flex items-center gap-2"
                      value="#FF8000"
                    >
                      <div className="w-10 h-10 bg-branding-orange rounded-full" />
                      <span className="text-gray-700 font-medium">#FF8000</span>
                    </CopyToClipboard>
                  </div>
                </div>
                <div>
                  <h3>Lichtblauw</h3>
                  <div className="w-fit">
                    <CopyToClipboard
                      className="flex items-center gap-2"
                      value="#007FFF"
                    >
                      <div className="w-10 h-10 bg-branding-light rounded-full" />
                      <span className="text-gray-700 font-medium">#007FFF</span>
                    </CopyToClipboard>
                  </div>
                </div>
                <div>
                  <h3>Donkerblauw</h3>
                  <div className="w-fit">
                    <CopyToClipboard
                      className="flex items-center gap-2"
                      value="#0047AB"
                    >
                      <div className="w-10 h-10 bg-branding-dark rounded-full" />
                      <span className="text-gray-700 font-medium">#0047AB</span>
                    </CopyToClipboard>
                  </div>
                </div>
              </div>
            </section>

            <section id="lettertype" className="scroll-mt-[140px]">
              <h2>Lettertype</h2>
              <p>
                Het lettertype van het Nationaal Watersportdiploma is{" "}
                <a
                  href="https://fonts.google.com/specimen/Inter"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Inter
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
