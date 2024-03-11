import {
  APP_SLOGAN,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  TIKTOK_URL,
  YOUTUBE_URL,
} from "@nawadi/lib/constants";
import Link from "next/link";
import { Facebook, Instagram, LinkedIn, TikTok, YouTube } from "../socials";

export default function Trustbar() {
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
    <section className="text-white py-2 sm:px-28 flex items-center justify-center lg:justify-between gap-2">
      <div className="xl:block hidden flex-1"></div>
      <p className="xl:text-center lg:text-start text-center flex-1 text-sm font-semibold uppercase">
        {APP_SLOGAN}
      </p>

      <ul className="items-center flex-1 gap-6 justify-end lg:flex hidden">
        {socials.map((social, i) => (
          <li key={i}>
            <Link
              className="relative group"
              href={social.link}
              target="_blank"
              referrerPolicy="no-referrer"
            >
              {/* Background on hover */}
              <div className="absolute inset-0 scale-150 bg-white rounded bg-opacity-0 group-hover:bg-opacity-100 transition-opacity" />
              <social.icon className="relative h-4 w-4 group-hover:text-[--brand-color]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
