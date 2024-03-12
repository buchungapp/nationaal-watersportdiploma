import {
  APP_NAME,
  APP_SLOGAN,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  TIKTOK_URL,
  YOUTUBE_URL,
} from "@nawadi/lib/constants";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { Line, LineWave } from "~/app/_assets/wave";
import Wordmark from "~/app/_components/brand/wordmark";
import { Facebook, Instagram, LinkedIn, TikTok, YouTube } from "~/app/_components/socials";

function FooterLink({ href, children }: PropsWithChildren<{ href: string }>) {
  return (
    <li>
      <Link
        href={href}
        className="px-2.5 py-1.5 -mx-2.5 -my-1.5 transition-colors rounded-lg w-fit hover:bg-white/10"
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
      link: FACEBOOK_URL,
    },
    {
      name: "Instagram",
      icon: Instagram,
      link: INSTAGRAM_URL,
    },
    {
      name: "LinkedIn",
      icon: LinkedIn,
      link: LINKEDIN_URL,
    },
    {
      name: "TikTok",
      icon: TikTok,
      link: TIKTOK_URL,
    },
    {
      name: "YouTube",
      icon: YouTube,
      link: YOUTUBE_URL,
    },
  ];

  return (
    <footer className="mt-32 grid gap-14 rounded-t-[3rem] bg-branding-dark px-4 lg:px-16 pt-20 pb-12">
      <div className="grid items-start gap-12 grid-cols-1 lg:grid-cols-2">
        <div className="grid gap-6">
          <Wordmark className="w-48 h-12 text-white" />
          <p className="text-slate-200 text-sm">{APP_SLOGAN}</p>
        </div>
        <div className="grid gap-12 lg:gap-0 items-start grid-cols-1 lg:grid-cols-3 text-sm">
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">Diplomeringslijn</h3>
            <ul className="grid gap-6 text-slate-200">
              <FooterLink href="/diplomalijn/consumenten">Consumenten</FooterLink>
              <FooterLink href="/diplomalijn/instructeurs">Instructeurs</FooterLink>
              <FooterLink href="/diplomalijn">Filosofie</FooterLink>
              <FooterLink href="/diplomalijn/accreditatie">Accreditatie</FooterLink>
            </ul>
          </div>
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">Locaties</h3>
            <ul className="grid gap-6 text-slate-200">
              <FooterLink href="/vaarlocaties">Aangesloten vaarlocaties</FooterLink>
              <FooterLink href="/kwaliteitseisen">Kwaliteitseisen</FooterLink>
              <FooterLink href="/procedures">Procedures</FooterLink>
            </ul>
          </div>
          <div className="grid gap-6">
            <h3 className="font-semibold uppercase text-white">Over NWD</h3>
            <ul className="grid gap-6 text-slate-200">
              <FooterLink href="/vereniging/manifest">Manifest</FooterLink>
              <FooterLink href="/faq">Veelgestelde vragen</FooterLink>
              <FooterLink href="/#TODO">Organisatie</FooterLink>
              <FooterLink href="/mediakit">Mediakit</FooterLink>
              <FooterLink href="/vereniging/vertrouwenspersoon">Vertrouwenspersoon</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>
        </div>
      </div>
      <Line className="w-full text-branding-light/20" />

      <div className="flex justify-between flex-col gap-4 lg:flex-row lg:items-center">
        <div className="grid gap-2 text-sm">
          <p className="text-white font-semibold">Schrijf je in voor de NWD-nieuwsbrief</p>
          <p className="text-slate-200">
            Ontvang nieuws, updates en leuk beeldmateriaal in je inbox.
          </p>
        </div>
        <form className="flex gap-2 text-sm" method="post" action={process.env.LOOPS_API_URL}>
          <input
            type="email"
            name="email"
            required
            className="placeholder:text-slate-400 min-w-[200px] rounded py-1.5 px-3 bg-[#003580] border border-[#004099] text-white"
            placeholder="Je e-mailadres"
          />
          <input type="hidden" name="userGroup" value="Website footer"></input>
          <button
            type="submit"
            className="text-white bg-branding-light hover:bg-white hover:text-branding-dark transition-colors group text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
          >
            Aanmelden
          </button>
        </form>
      </div>

      <LineWave progress="60%" />

      <div className="text-slate-200 flex flex-col lg:flex-row gap-4">
        <p className="lg:text-start text-center flex-1 text-sm">
          {`© ${new Date().getFullYear()} ${APP_NAME}`}
        </p>
        <ul className="items-center flex-1 gap-6 justify-center lg:justify-end flex">
          {socials.map((social, i) => (
            <li key={i}>
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
