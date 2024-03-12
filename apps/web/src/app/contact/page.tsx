import Image from "next/image";
import { InlineButton, TekstButton } from "../_components/style/buttons";
import PageHero from "../_components/style/page-hero";

import { AtSymbolIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Article from "../_components/style/article";
import CopyToClipboard from "../_components/style/copy-to-clipboard";
import contact from "./_assets/contact.jpg";

export default function Contact() {
  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="text-white grid gap-6">
            <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl max-w-lg">Contact</h1>
            <p className="text-xl">Een vraag? Wij staan klaar om je te helpen!</p>
          </div>
        </div>
      </PageHero>
      <div className="flex flex-col gap-12 w-full mt-12 px-4 lg:px-16">
        <div className="columns-1 lg:columns-3 space-y-8 gap-8">
          {[
            {
              title: "Helpcentrum",
              description: "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
              label: "Naar het helpcentrum",
              href: "/faq",
            },
            {
              title: "Mediakit",
              description:
                "Alle NWD-merkmaterialen, zoals logo's en kleuren, overzichtelijk bij elkaar.",
              label: "Open de mediakit",
              href: "/mediakit",
            },
            {
              title: "Contacteer jouw vaarlocatie",
              description: "Vragen over diploma's en opleidingen? Start bij je eigen vaarlocatie.",
              label: "Bekijk NWD-vaarlocaties",
              href: "/locaties",
            },
          ].map((item) => (
            <article
              key={item.href}
              className="bg-gray-100 rounded-2xl p-10 break-inside-avoid grid gap-2"
            >
              <h2 className="font-semibold text-lg">{item.title}</h2>
              <p>{item.description}</p>
              <TekstButton href={item.href} className="mt-2 text-branding-dark">
                {item.label}
              </TekstButton>
            </article>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <Image
            src={contact}
            alt="Contact"
            width={contact.width}
            height={contact.height}
            className="rounded-3xl h-full object-cover"
          />
          <div className="flex flex-col gap-8">
            <Article>
              <Article.Heading className="text-branding-dark">Secretariaat</Article.Heading>
              <Article.Title>Neem contact op</Article.Title>
              <Article.Paragraph className="text-gray-700">
                Het{" "}
                <Link href={"/vereniging/secretariaat"} className="underline">
                  secretariaat
                </Link>{" "}
                helpt met vragen van consumenten, instructeurs, vaarlocaties, de pers en meer. Zij
                beantwoorden je vraag of verwijzen je door binnen het Nationaal Watersportdiploma.
              </Article.Paragraph>
            </Article>
            <ul className="text-gray-700 flex flex-col gap-4">
              <li className="w-fit">
                <CopyToClipboard
                  value={"info@nationaalwatersportdiploma.nl"}
                  className="flex gap-4 items-center underline"
                >
                  <AtSymbolIcon className="w-5 h-5" />
                  info@nationaalwatersportdiploma.nl
                </CopyToClipboard>
              </li>
              <li className="w-fit">
                <InlineButton href="tel:0857822777" className="flex gap-4 items-center underline">
                  <PhoneIcon className="w-5 h-5" />
                  085 - 782 27 77
                </InlineButton>
              </li>
              <li className="flex gap-4 items-center">
                <EnvelopeIcon className="w-5 h-5" />
                Wilhelmina van Pruisenweg 35 <br />
                2595AN Den Haag
              </li>
            </ul>
            <p>
              <strong>KvK</strong> 92327249
              <br />
              <strong>IBAN</strong> NL 01 INGB 0003 123 456
              <br />
              <strong>BIC</strong> INGBNL2A
              <br />
              <strong>BTW</strong> NL123456789B01
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
