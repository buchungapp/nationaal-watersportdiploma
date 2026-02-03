import { clsx } from "clsx";
import { Toaster } from "sonner";
import "sonner/dist/styles.css";
import { CommonProviders, MarketingProviders } from "../_components/providers";
import Footer from "./_components/footer/footer";
import Header from "./_components/header/header";

import { constants } from "@nawadi/lib";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BASE_URL } from "~/constants";

import { ImpersonationBarWrapper } from "../(dashboard)/_components/impersonation-bar-wrapper";
import Analytics from "../_components/analytics";
import "../globals.css";
import { Suspense } from "react";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={clsx(
        inter.variable,
        "h-full scroll-smooth antialiased text-slate-900 bg-white",
      )}
    >
      <body className="h-full">
        <Suspense>
          <CommonProviders />
        </Suspense>
        <MarketingProviders>
          <ImpersonationBarWrapper />
          {/* Wrap in a div because of: https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1724096430 */}
          <div>
            <Header />
            <div id="content" className="[--header-height:112px]">
              {children}
            </div>
            <Footer />
          </div>
        </MarketingProviders>

        <Toaster richColors />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
