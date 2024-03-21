import { clsx } from "clsx";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import Analytics from "~/app/_components/analytics";
import Footer from "./_components/footer/footer";
import Header from "./_components/header/header";

import { APP_NAME, APP_SLOGAN } from "@nawadi/lib/constants";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BASE_URL } from "~/constants";
import { HAVE_WE_LAUNCHED } from "../../launch-control";
import "./globals.css";
import { Providers } from "./providers";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | ${APP_SLOGAN}`,
    template: `%s | ${APP_NAME}`,
  },
  applicationName: APP_NAME,
  // 🚀 launch control
  description: HAVE_WE_LAUNCHED
    ? `Nationaal Watersportdiploma: dé standaard voor veiligheid, kwaliteit en plezier op het water. Erkend door het Watersportverbond, met hoge kwaliteitseisen aan vaarlocaties.`
    : `Nationaal Watersportdiploma: dé standaard voor veiligheid, kwaliteit en plezier op het water. Met een moderne diplomalijn, en hoge kwaliteitseisen aan vaarlocaties.`,
  metadataBase: BASE_URL,
  icons: {
    shortcut: "/favicon.ico",
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
        <Providers>
          <Analytics />
          {/* Wrap in a div because of: https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1724096430 */}
          <div>
            <Header />
            <div id="content">{children}</div>
            <Footer />
          </div>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
