import { constants } from "@nawadi/lib";

import { clsx } from "clsx";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { BASE_URL } from "~/constants";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";

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
          {children}

          <Toaster richColors />
          <SpeedInsights />
          <Analytics />
        </CommonProviders>
      </body>
    </html>
  );
}
