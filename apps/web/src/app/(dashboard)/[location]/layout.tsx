import { Toaster } from "sonner";
import LatestNews from "./_components/latest-news";
import { LocationSelector } from "./_components/location-selector";
import { LocationSidebarMenu } from "./_components/sidebar-menu";
import { UserSelector } from "./_components/user-selector";

export default function Layout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { location: string };
}>) {
  return (
    <>
      <div className="fixed inset-y-0 hidden w-72 flex-col sm:flex">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="https://www.nationaalwatersportdiploma.nl/_next/static/media/NWD-logo-final.92b2eb4c.svg"
              alt="Nationaal Watersportdiploma"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li className="">
                <LocationSelector currentLocationSlug={params.location} />
              </li>
              <li>
                <LocationSidebarMenu />
              </li>
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">
                  Actueel
                </div>
                <LatestNews />
              </li>
              <li className="mt-auto pb-4">
                <UserSelector />
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <main className="py-2.5 h-screen flex flex-col lg:pl-72 pr-2.5">
        <div className="px-4 sm:px-8 shadow flex-1 ring-1 ring-gray-200 rounded min-h-full lg:px-12 bg-white overflow-y-auto">
          {children}
        </div>
      </main>
      <Toaster richColors />
    </>
  );
}
