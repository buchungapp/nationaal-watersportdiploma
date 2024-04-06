import { clsx } from "clsx";

import { APP_NAME, APP_SLOGAN } from "@nawadi/lib/constants";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BASE_URL } from "~/constants";

import { CommonProviders } from "../_components/providers";

import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="nl" className="scroll-smooth">
      <body className={clsx(inter.variable, "text-gray-900")}>
        <CommonProviders>
          {/* Wrap in a div because of: https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1724096430 */}
          <div>
            <div id="content">{children}</div>
          </div>
        </CommonProviders>
      </body>
    </html>
  );
}
