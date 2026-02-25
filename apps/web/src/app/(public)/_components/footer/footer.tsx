import { constants } from "@nawadi/lib";
import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import watersportverbondWhite from "~/app/_assets/watersportverbond-white.png";
import NWDWordmark from "~/app/_components/brand/wordmark";
import {
  Facebook,
  Instagram,
  LinkedIn,
  TikTok,
  YouTube,
} from "~/app/_components/socials";
import { Line, LineWave } from "~/app/(public)/_assets/wave";

function FooterLink({ href, children }: PropsWithChildren<{ href: string }>) {
  return (
    <li>
      <Link
        href={href}
        className="hover:bg-white/10 -mx-2.5 -my-1.5 px-2.5 py-1.5 rounded-lg w-fit transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

async function getYear() {
  "use cache";
  cacheLife("weeks");

  return new Date().getFullYear();
}

export default async function Footer() {
  const socials = [
    {
      name: "Facebook",
      icon: Facebook,
      link: constants.FACEBOOK_URL,
    },
    {
      name: "Instagram",
      icon: Instagram,
      link: constants.INSTAGRAM_URL,
    },
    {
      name: "LinkedIn",
      icon: LinkedIn,
      link: constants.LINKEDIN_URL,
    },
    {
      name: "TikTok",
      icon: TikTok,
      link: constants.TIKTOK_URL,
    },
    {
      name: "YouTube",
      icon: YouTube,
      link: constants.YOUTUBE_URL,
    },
  ];

  return (
    <footer className="gap-14 grid bg-branding-dark mt-32 px-4 lg:px-16 pt-20 pb-12 rounded-t-[3rem]">
      <div className="items-start gap-12 grid grid-cols-1 lg:grid-cols-2">
        <div>
          <div className="justify-start gap-6 grid">
            <NWDWordmark className="w-fit h-16 text-white" />
            <p className="text-slate-200 text-sm">{constants.APP_SLOGAN}</p>
          </div>

          <div className="mt-12">
            <p className="font-semibold text-white/55 text-sm uppercase">
              Gelicentieerd door
            </p>
            <Link href="/partners">
              <Image
                src={watersportverbondWhite}
                className="mt-3.5 w-auto h-14"
                alt="Watersportverbond"
              />
            </Link>
          </div>
        </div>
        <div className="items-start gap-12 lg:gap-0 grid grid-cols-1 lg:grid-cols-3 text-sm">
          <div className="gap-6 grid">
            <h3 className="font-semibold text-white uppercase">
              Diplomeringslijn
            </h3>
            <ul className="gap-6 grid text-slate-200">
              <FooterLink href="/diplomalijn/consument">Consumenten</FooterLink>
              <FooterLink href="/diplomalijn/instructeur">
                Instructeurs
              </FooterLink>
            </ul>
          </div>
          <div className="gap-6 grid">
            <h3 className="font-semibold text-white uppercase">Locaties</h3>
            <ul className="gap-6 grid text-slate-200">
              <FooterLink href="/vaarlocaties">
                Aangesloten vaarlocaties
              </FooterLink>
              <FooterLink href="/voor-vaarlocaties">
                Voor vaarlocaties
              </FooterLink>
              <FooterLink href="/vaarlocaties/kwaliteitsgarantie">
                Kwaliteitsgarantie
              </FooterLink>
            </ul>
          </div>
          <div className="gap-6 grid">
            <h3 className="font-semibold text-white uppercase">Over NWD</h3>
            <ul className="gap-6 grid text-slate-200">
              <FooterLink href="/vereniging/manifest">Manifest</FooterLink>
              <FooterLink href="/help">Helpcentrum</FooterLink>
              <FooterLink href="/vereniging/bestuur">Bestuur</FooterLink>
              <FooterLink href="/merk">Merkkit</FooterLink>
              <FooterLink href="/vereniging/vertrouwenspersoon">
                Vertrouwenspersoon
              </FooterLink>
              <FooterLink href="/partners">Partners</FooterLink>
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>
        </div>
      </div>
      <Line className="w-full text-branding-light/20" />

      <div className="flex lg:flex-row flex-col justify-between lg:items-center gap-4">
        <div className="gap-2 grid text-sm">
          <p className="font-semibold text-white">
            Schrijf je in voor de NWD-nieuwsbrief
          </p>
          <p className="text-slate-200">
            Ontvang nieuws, updates en leuk beeldmateriaal in je inbox.
          </p>
        </div>
        <form
          className="flex gap-2 text-sm"
          method="post"
          action={process.env.LOOPS_API_URL}
        >
          <input
            type="email"
            name="email"
            required
            className="bg-[#003580] px-3 py-1.5 border border-[#004099] rounded-sm min-w-[200px] text-white placeholder:text-slate-400"
            placeholder="Je e-mailadres"
          />
          <input type="hidden" name="userGroup" value="Website footer" />
          <button
            type="submit"
            className="group flex items-center gap-1 bg-branding-light hover:bg-white px-4 py-2 rounded-lg w-fit font-semibold text-white hover:text-branding-dark text-sm transition-colors"
          >
            Aanmelden
          </button>
        </form>
      </div>

      <LineWave progress="60%" />

      <div className="flex lg:flex-row flex-col gap-4 text-slate-200">
        <p className="flex-1 text-sm text-center lg:text-start">
          {`© ${await getYear()} ${constants.APP_NAME}`}
        </p>
        <ul className="flex flex-1 justify-center lg:justify-end items-center gap-6">
          {socials.map((social) => (
            <li key={social.name}>
              <Link
                href={social.link}
                className="hover:text-white"
                target="_blank"
                referrerPolicy="no-referrer"
              >
                <social.icon className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
