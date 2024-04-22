import {
  AcademicCapIcon,
  RectangleStackIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Avatar } from "../_components/avatar";
import LatestNews from "./_components/latest-news";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
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
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {[
                    {
                      name: "Cohorten",
                      href: "#",
                      icon: RectangleStackIcon,
                      current: false,
                    },
                    {
                      name: "Personen",
                      href: "#",
                      icon: UserGroupIcon,
                      current: false,
                    },
                    {
                      name: "Diploma's",
                      href: "#",
                      icon: AcademicCapIcon,
                      current: false,
                    },
                  ].map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={clsx(
                          item.current
                            ? "bg-gray-50 text-branding-dark"
                            : "text-gray-700 hover:text-branding-dark hover:bg-gray-50",
                          "group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                        )}
                      >
                        <item.icon
                          className={clsx(
                            item.current
                              ? "text-branding-dark"
                              : "text-gray-400 group-hover:text-branding-dark",
                            "h-5 w-5 shrink-0",
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">
                  Actueel
                </div>
                <LatestNews />
              </li>
              <li className="-mx-6 mt-auto">
                <a
                  href="#"
                  className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
                >
                  <Avatar
                    className="size-8 bg-gray-500 text-white"
                    initials="Ma"
                    square={true}
                  />
                  <span className="sr-only">Jouw profiel</span>
                  <span aria-hidden="true">Maurits</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <main className="py-2.5 min-h-full flex flex-col lg:pl-72 pr-2.5">
        <div className="px-4 sm:px-6 shadow flex-1 ring-1 ring-gray-200 rounded min-h-full lg:px-8 bg-white">
          {children}
        </div>
      </main>
    </>
  );
}
