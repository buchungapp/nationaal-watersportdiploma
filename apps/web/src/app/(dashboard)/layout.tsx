import { clsx } from "clsx";
import { Toaster } from "sonner";

import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BASE_URL } from "~/constants";

import { constants } from "@nawadi/lib";
import Analytics from "../_components/analytics";
import { CommonProviders } from "../_components/providers";
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
  description:
    "Dé standaard voor veiligheid, kwaliteit en plezier op het water. Diplomalijn erkend door het Watersportverbond, met hoge kwaliteitseisen aan vaarlocaties.",
  metadataBase: BASE_URL,
  icons: {
    shortcut: "/favicon.ico",
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
  robots: {
    index: false,
    follow: false,
  },
};

export const runtime = "nodejs";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={clsx(
        inter.variable,
        "scroll-smooth antialiased bg-white lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950",
      )}
    >
      <body>
        <CommonProviders>
          {children}

          <Toaster richColors />
          <SpeedInsights />
          <Analytics />
        </CommonProviders>
      </body>
    </html>
  );
}
