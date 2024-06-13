import { MarketingProviders } from "../_components/providers";
import Footer from "./_components/footer/footer";
import Header from "./_components/header/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MarketingProviders>
      {/* Wrap in a div because of: https://github.com/tailwindlabs/headlessui/issues/2752#issuecomment-1724096430 */}
      <div>
        <Header />
        <div id="content" className="[--header-height:112px]">
          {children}
        </div>
        <Footer />
      </div>
    </MarketingProviders>
  );
}
