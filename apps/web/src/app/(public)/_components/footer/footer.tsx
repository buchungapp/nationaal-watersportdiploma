import { constants } from "@nawadi/lib";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import watersportverbondWhite from "~/app/(public)/_assets/watersportverbond-white.png";

import Image from "next/image";
import { Line, LineWave } from "~/app/(public)/_assets/wave";
import Wordmark from "~/app/_components/brand/wordmark";
import {
  Facebook,
  Instagram,
  LinkedIn,
  TikTok,
  YouTube,
} from "~/app/_components/socials";

function FooterLink({ href, children }: PropsWithChildren<{ href: string }>) {
  return (
    <li>
      <Link
        href={href}
        className="-mx-2.5 -my-1.5 w-fit rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/10"
      >
        {children}
      </Link>
    </li>
  );
}

export default function Footer() {
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
    <footer className="mt-32 grid gap-14 rounded-t-[3rem] bg-branding-dark px-4 pb-12 pt-20 lg:px-16">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
        <div>
          <div className="grid gap-6">
            <Wordmark className="h-12 w-48 text-white" />
            <p className="text-sm text-slate-200">{constants.APP_SLOGAN}</p>
          </div>

          <div className="mt-12">
            <p className="text-sm uppercase font-semibold text-white/55">
              Gelicentieerd door
            </p>
            <Link href="/partners">
              <Image
                src={watersportverbondWhite}
                className="h-14 w-auto mt-3.5"
                alt="Watersportverbond"
              />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 items-start gap-12 text-sm lg:grid-cols-3 lg:gap-0">
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">
              Diplomeringslijn
            </h3>
            <ul className="grid gap-6 text-slate-200">
              <FooterLink href="/diplomalijn/consument">Consumenten</FooterLink>
              <FooterLink href="/diplomalijn/instructeur">
                Instructeurs
              </FooterLink>
            </ul>
          </div>
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">Locaties</h3>
            <ul className="grid gap-6 text-slate-200">
              <FooterLink href="/vaarlocaties">
                Aangesloten vaarlocaties
              </FooterLink>
              <FooterLink href="/vaarlocaties/kwaliteitseisen">
                Kwaliteitseisen
              </FooterLink>
            </ul>
          </div>
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">Over NWD</h3>
            <ul className="grid gap-6 text-slate-200">
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

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="grid gap-2 text-sm">
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
            className="min-w-[200px] rounded-sm border border-[#004099] bg-[#003580] px-3 py-1.5 text-white placeholder:text-slate-400"
            placeholder="Je e-mailadres"
          />
          <input type="hidden" name="userGroup" value="Website footer" />
          <button
            type="submit"
            className="group flex w-fit items-center gap-1 rounded-lg bg-branding-light px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-branding-dark"
          >
            Aanmelden
          </button>
        </form>
      </div>

      <LineWave progress="60%" />

      <div className="flex flex-col gap-4 text-slate-200 lg:flex-row">
        <p className="flex-1 text-center text-sm lg:text-start">
          {`© ${new Date().getFullYear()} ${constants.APP_NAME}`}
        </p>
        <ul className="flex flex-1 items-center justify-center gap-6 lg:justify-end">
          {socials.map((social) => (
            <li key={social.name}>
              <Link
                href={social.link}
                className="hover:text-white"
                target="_blank"
                referrerPolicy="no-referrer"
              >
                <social.icon className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
