import Image from 'next/image'
import Link from 'next/link'
import Balancer from 'react-wrap-balancer'

import Double from '~/app/_components/brand/double-line'
import { BoxedButton } from '~/app/_components/style/buttons'
import aankondiging from './_assets/aankondiging.jpg'
import diplomalijn from './_assets/diplomalijn.jpg'
import zwemvest from './_assets/zwemvest.png'

export default function News() {
  return (
    <section className="container mx-auto grid gap-20 px-4 lg:px-16">
      <div className="flex w-full flex-col items-center text-center">
        <div className="flex w-full items-center gap-x-3 font-bold uppercase text-branding-orange">
          <Double />
          Actueel
          <Double />
        </div>
        <h3 className="mt-1.5 text-2xl font-bold text-gray-900">
          De laatste ontwikkelingen.
        </h3>
        <p className="mx-auto mt-2.5 max-w-prose text-gray-700">
          We doen super leuke dingen bij het NWD, dus we houden je via deze mega
          leuk blog op de hoogte van alle verhaaltjes en ditjes en datjes die er
          zijn! Super leuk zeker lezen.
        </p>

        <BoxedButton
          href="/nieuws"
          className="mt-8 bg-branding-orange text-white"
        >
          Meer nieuws
        </BoxedButton>
      </div>
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-3">
        {[
          {
            href: '/nieuws/1',
            image: aankondiging,
            title: 'Aankondiging Nationaal Watersportdiploma.',
            date: '11 maart 2024',
            description:
              'A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.',
          },
          {
            href: '/nieuws/2',
            image: diplomalijn,
            title: 'Werk aan de diplomalijnen nagenoeg afgerond.',
            date: '9 maart 2024',
            description:
              'A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.',
          },
          {
            href: '/nieuws/3',
            image: zwemvest,
            title: 'Zwemvesten, niet hip maar wel noodzakelijk!',
            date: '8 maart 2024',
            description:
              'A simple rule to calculate line height is 1.5x font size. However, this is not cast in stone and you are free to titrate.',
          },
        ].map((news) => (
          <Link
            key={news.href}
            href={news.href}
            className="-m-4 rounded-3xl p-4 transition-colors hover:bg-gray-100"
          >
            <article className="grid">
              <Image
                src={news.image}
                alt={news.title}
                width={news.image.width}
                height={news.image.height}
                className="aspect-video rounded-2xl object-cover"
              />
              <div className="grid gap-2 py-4">
                <span className="text-sm text-branding-dark">{news.date}</span>
                <h3 className="text-xl font-bold">
                  <Balancer>{news.title}</Balancer>
                </h3>
                <p className="text-gray-700">{news.description}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  )
}
