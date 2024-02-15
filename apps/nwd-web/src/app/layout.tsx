import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Analytics from "~/app/_components/analytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nationaal Watersportdiploma",
  description: "Jouw watersportavontuur begint bij ons, veilig en vol plezier!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <Analytics />
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
