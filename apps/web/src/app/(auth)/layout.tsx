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

import { ImpersonationBarWrapper } from "~/app/(dashboard)/_components/impersonation-bar-wrapper";
import Analytics from "~/app/_components/analytics";
import { CommonProviders } from "~/app/_components/providers";

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
  description:
    "Dé standaard voor veiligheid, kwaliteit en plezier op het water. Diplomalijn erkend door het Watersportverbond, met hoge kwaliteitseisen aan vaarlocaties.",
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
    description:
      "Dé standaard voor veiligheid, kwaliteit en plezier op het water. Diplomalijn erkend door het Watersportverbond, met hoge kwaliteitseisen aan vaarlocaties.",
    url: "/",
    siteName: constants.APP_NAME,
    locale: "nl_NL",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="nl"
      className={clsx(
        inter.variable,
        "h-full scroll-smooth antialiased text-slate-900 bg-white",
      )}
    >
      <body className="h-full">
        <CommonProviders>
          <ImpersonationBarWrapper />
          {/*  Wrap in a div because of: https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1724096430 */}
          <div className="h-full">
            <div className="flex flex-1 min-h-full">
              <div className="flex flex-col flex-1 lg:flex-none justify-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
                {children}
              </div>
              <div className="hidden lg:block relative flex-1 w-0">
                <Image
                  className="absolute inset-0 w-full h-full object-cover"
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
