import {
  AtSymbolIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import type { Metadata, ResolvingMetadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Article from "../_components/style/article";
import { InlineButton, TekstButton } from "../_components/style/buttons";
import CopyToClipboard from "../_components/style/copy-to-clipboard";
import PageHero from "../_components/style/page-hero";
import contact from "./_assets/contact.jpg";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const parentOpenGraph = (await parent).openGraph;

  return {
    title: "Contact",
    description:
      "Bezoek het helpcentrum, download de mediakit of neem contact op.",
    alternates: {
      canonical: "/contact",
    },
    openGraph: {
      ...parentOpenGraph,
      title: "Contact",
      description:
        "Bezoek het helpcentrum, download de mediakit of neem contact op.",
      url: "/contact",
    },
  };
}

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
              Bezoek het helpcentrum, download de mediakit of neem contact op.
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
              href: "/help",
            },
            {
              title: "Mediakit",
              description:
                "Alle NWD-merkmaterialen, zoals logo's en kleuren, overzichtelijk bij elkaar.",
              label: "Open de mediakit",
              href: "/merk",
            },
            {
              title: "Contacteer jouw vaarlocatie",
              description:
                "Vragen over diploma's en opleidingen? Start bij je eigen vaarlocatie.",
              label: "Bekijk NWD-vaarlocaties",
              href: "/vaarlocaties",
            },
          ].map((item) => (
            <article
              key={item.href}
              className="grid break-inside-avoid gap-2 rounded-2xl bg-slate-100 p-10"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p>{item.description}</p>
              <TekstButton
                href={item.href}
                className="mt-2 text-branding-dark hover:bg-branding-dark/10"
              >
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
            placeholder="blur"
            className="h-full rounded-3xl object-cover"
          />
          <div className="flex flex-col gap-8">
            <Article>
              <Article.Heading className="text-branding-dark">
                Secretariaat
              </Article.Heading>
              <Article.Title>Neem contact op</Article.Title>
              <Article.Paragraph className="text-slate-700">
                Het{" "}
                <Link
                  href={"/vereniging/secretariaat"}
                  className="underline text-branding-light hover:text-branding-dark"
                >
                  secretariaat
                </Link>{" "}
                helpt met vragen van consumenten, instructeurs, vaarlocaties, de
                pers en meer. Zij beantwoorden je vraag of verwijzen je door
                binnen het Nationaal Watersportdiploma.
              </Article.Paragraph>
            </Article>
            <ul className="flex flex-col gap-4 text-slate-700">
              <li className="w-fit">
                <CopyToClipboard
                  value={"info@nationaalwatersportdiploma.nl"}
                  className="flex items-center gap-4 underline"
                >
                  <AtSymbolIcon className="size-5" />
                  info@nationaalwatersportdiploma.nl
                </CopyToClipboard>
              </li>
              <li className="w-fit">
                <InlineButton
                  href="tel:0857822777"
                  className="flex items-center gap-4 underline"
                >
                  <PhoneIcon className="size-5" />
                  085 - 782 27 77
                </InlineButton>
              </li>
              <li className="flex items-start gap-4">
                <EnvelopeIcon className="h-6 w-5 shrink-0" />
                Waldorpstraat 5 <br />
                2521CA Den Haag
              </li>
            </ul>
            <p>
              <strong>KvK</strong> 92327249
              <br />
              <strong>IBAN</strong> NL22 INGB 0106 2450 82
              <br />
              <strong>BIC</strong> INGBNL2A
              {/* TODO: This is not known yet */}
              {/* <br />
              <strong>BTW</strong> NL123456789B01 */}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
