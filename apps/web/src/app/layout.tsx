import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { clsx } from 'clsx'

import Analytics from '~/app/_components/analytics'
import Footer from './_components/footer/footer'
import Header from './_components/header/header'

import './globals.css'

import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Nationaal Watersportdiploma',
  description: 'Jouw watersportavontuur begint bij ons, veilig en vol plezier!',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl">
      <Analytics />
      <body className={clsx(inter.variable, 'overflow-x-hidden text-gray-900')}>
        {/* Wrap in a div because of: https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1724096430 */}
        <div>
          <Providers>
            <Header />
            <div id="content">{children}</div>
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  )
}
