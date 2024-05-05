import { clsx } from "clsx";

import { constants } from "@nawadi/lib";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BASE_URL } from "~/constants";

import { CommonProviders } from "./_components/providers";
import "./globals.css";

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
        "h-full scroll-smooth antialiased text-gray-900 bg-white !pr-0",
      )}
    >
      <body className="h-full">
        <CommonProviders>{children}</CommonProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
