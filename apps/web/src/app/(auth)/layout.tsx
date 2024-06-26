import { constants } from "@nawadi/lib";
import Image from "next/image";
import coverImage from "./_assets/zeilen-4.jpg";
import SessionCheck from "./login/_components/session-check";

import { clsx } from "clsx";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { BASE_URL } from "~/constants";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";

import Analytics from "~/app/_components/analytics";
import { CommonProviders } from "~/app/_components/providers";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${constants.APP_NAME} | ${constants.APP_SLOGAN}`,
    template: `%s | ${constants.APP_NAME}`,
  },
  applicationName: constants.APP_NAME,
  description: `Dé standaard voor veiligheid, kwaliteit en plezier op het water. Diplomalijn erkend door het Watersportverbond, met hoge kwaliteitseisen aan vaarlocaties.`,
  metadataBase: BASE_URL,
  icons: {
    shortcut: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: {
      default: `${constants.APP_NAME} | ${constants.APP_SLOGAN}`,
      template: `%s | ${constants.APP_NAME}`,
    },
    description: `Dé standaard voor veiligheid, kwaliteit en plezier op het water. Diplomalijn erkend door het Watersportverbond, met hoge kwaliteitseisen aan vaarlocaties.`,
    url: "/",
    siteName: constants.APP_NAME,
    locale: "nl_NL",
    type: "website",
  },
};

export const runtime = "nodejs";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="nl"
      className={clsx(
        inter.variable,
        "h-full scroll-smooth antialiased text-gray-900 bg-white",
      )}
    >
      <body className="h-full">
        <CommonProviders>
          {/*  Wrap in a div because of: https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1724096430 */}
          <div className="h-full">
            <div className="flex min-h-full flex-1">
              <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                {children}
              </div>
              <div className="relative hidden w-0 flex-1 lg:block">
                <Image
                  className="absolute inset-0 h-full w-full object-cover"
                  priority
                  src={coverImage}
                  placeholder="blur"
                  alt=""
                />
              </div>
            </div>
            <SessionCheck />
          </div>

          <Toaster richColors />
          <SpeedInsights />
          <Analytics />
        </CommonProviders>
      </body>
    </html>
  );
}
