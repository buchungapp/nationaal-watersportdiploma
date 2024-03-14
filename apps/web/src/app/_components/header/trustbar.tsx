import Link from 'next/link'

import {
  APP_SLOGAN,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  TIKTOK_URL,
  YOUTUBE_URL,
} from '@nawadi/lib/constants'

import { Facebook, Instagram, LinkedIn, TikTok, YouTube } from '../socials'

export default function Trustbar() {
  const socials = [
    {
      name: 'Facebook',
      icon: Facebook,
      link: FACEBOOK_URL,
    },
    {
      name: 'Instagram',
      icon: Instagram,
      link: INSTAGRAM_URL,
    },
    {
      name: 'LinkedIn',
      icon: LinkedIn,
      link: LINKEDIN_URL,
    },
    {
      name: 'TikTok',
      icon: TikTok,
      link: TIKTOK_URL,
    },
    {
      name: 'YouTube',
      icon: YouTube,
      link: YOUTUBE_URL,
    },
  ]

  return (
    <section className="flex items-center justify-center gap-2 py-2 text-white sm:px-28 lg:justify-between">
      <div className="hidden flex-1 xl:block"></div>
      <p className="flex-1 text-center text-sm font-semibold uppercase lg:text-start xl:text-center">
        {APP_SLOGAN}
      </p>

      <ul className="hidden flex-1 items-center justify-end gap-6 lg:flex">
        {socials.map((social, i) => (
          <li key={i}>
            <Link
              className="group relative"
              href={social.link}
              target="_blank"
              referrerPolicy="no-referrer"
            >
              {/* Background on hover */}
              <div className="absolute inset-0 scale-150 rounded bg-white bg-opacity-0 transition-opacity group-hover:bg-opacity-100" />
              <social.icon className="relative h-4 w-4 group-hover:text-[--brand-color]" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
