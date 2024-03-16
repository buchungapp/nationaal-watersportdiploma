import {
  AtSymbolIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

import Article from "../_components/style/article";
import { InlineButton, TekstButton } from "../_components/style/buttons";
import CopyToClipboard from "../_components/style/copy-to-clipboard";
import PageHero from "../_components/style/page-hero";
import contact from "./_assets/contact.jpg";

export default function Contact() {
  return (
    <main className="flex flex-col items-center">
      <PageHero>
        <div className="px-4 lg:px-16">
          <div className="grid gap-6 text-white">
            <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
              Contact
            </h1>
            <p className="text-xl">
              Een vraag? Wij staan klaar om je te helpen!
            </p>
          </div>
        </div>
      </PageHero>
      <div className="mt-12 flex w-full flex-col gap-12 px-4 lg:px-16">
        <div className="columns-1 gap-8 space-y-8 lg:columns-3">
          {[
            {
              title: "Helpcentrum",
              description:
                "Ontdek antwoorden op veelgestelde vragen, handige documenten en meer.",
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
              description:
                "Vragen over diploma's en opleidingen? Start bij je eigen vaarlocatie.",
              label: "Bekijk NWD-vaarlocaties",
              href: "/locaties",
            },
          ].map((item) => (
            <article
              key={item.href}
              className="grid break-inside-avoid gap-2 rounded-2xl bg-gray-100 p-10"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p>{item.description}</p>
              <TekstButton href={item.href} className="mt-2 text-branding-dark">
                {item.label}
              </TekstButton>
            </article>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <Image
            src={contact}
            alt="Contact"
            width={contact.width}
            height={contact.height}
            className="h-full rounded-3xl object-cover"
          />
          <div className="flex flex-col gap-8">
            <Article>
              <Article.Heading className="text-branding-dark">
                Secretariaat
              </Article.Heading>
              <Article.Title>Neem contact op</Article.Title>
              <Article.Paragraph className="text-gray-700">
                Het{" "}
                <Link href={"/vereniging/secretariaat"} className="underline">
                  secretariaat
                </Link>{" "}
                helpt met vragen van consumenten, instructeurs, vaarlocaties, de
                pers en meer. Zij beantwoorden je vraag of verwijzen je door
                binnen het Nationaal Watersportdiploma.
              </Article.Paragraph>
            </Article>
            <ul className="flex flex-col gap-4 text-gray-700">
              <li className="w-fit">
                <CopyToClipboard
                  value={"info@nationaalwatersportdiploma.nl"}
                  className="flex items-center gap-4 underline"
                >
                  <AtSymbolIcon className="h-5 w-5" />
                  info@nationaalwatersportdiploma.nl
                </CopyToClipboard>
              </li>
              <li className="w-fit">
                <InlineButton
                  href="tel:0857822777"
                  className="flex items-center gap-4 underline"
                >
                  <PhoneIcon className="h-5 w-5" />
                  085 - 782 27 77
                </InlineButton>
              </li>
              <li className="flex items-start gap-4">
                <EnvelopeIcon className="h-6 w-5 flex-shrink-0" />
                Wilhelmina van Pruisenweg 35 <br />
                2595AN Den Haag
              </li>
            </ul>
            <p>
              <strong>KvK</strong> 92327249
              {/* TODO: these are not known yet */}
              {/* <br />
              <strong>IBAN</strong> NL 01 INGB 0003 123 456
              <br />
              <strong>BIC</strong> INGBNL2A
              <br />
              <strong>BTW</strong> NL123456789B01 */}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
