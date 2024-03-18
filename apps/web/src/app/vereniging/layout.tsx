import { APP_NAME } from "@nawadi/lib/constants";
import PageHeader from "./_components/page-header";

import type { Metadata } from "next";
import SideNavVereniging, { verenigingsPages } from "./_components/side-nav";

export const metadata: Metadata = {
  title: {
    template: `%s | Verenigingszaken | ${APP_NAME}`,
    default: "Verenigingszaken",
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <PageHeader pages={verenigingsPages} />
      <div className="mt-12 grid grid-cols-1 items-start gap-12 px-4 sm:grid-cols-[1fr,3fr] lg:px-16">
        <div className="flex justify-end h-full">
          <SideNavVereniging />
        </div>
        <div className="flex flex-col justify-center">{children}</div>
      </div>
    </main>
  );
}
