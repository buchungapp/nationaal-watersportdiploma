import { clsx } from "clsx";

import { APP_NAME, APP_SLOGAN } from "@nawadi/lib/constants";
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
    default: `${APP_NAME} | ${APP_SLOGAN}`,
    template: `%s | ${APP_NAME}`,
  },
  applicationName: APP_NAME,
  description: `Dé standaard voor veiligheid, kwaliteit en plezier op het water. Diplomalijn erkend door het Watersportverbond, met hoge kwaliteitseisen aan vaarlocaties.`,
  metadataBase: BASE_URL,
  icons: {
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: {
      default: `${APP_NAME} | ${APP_SLOGAN}`,
      template: `%s | ${APP_NAME}`,
    },
    description: `Dé standaard voor veiligheid, kwaliteit en plezier op het water. Diplomalijn erkend door het Watersportverbond, met hoge kwaliteitseisen aan vaarlocaties.`,
    url: "/",
    siteName: APP_NAME,
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
        "h-full scroll-smooth text-gray-900 bg-white",
      )}
    >
      <body className="h-full">
        <CommonProviders>{children}</CommonProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
