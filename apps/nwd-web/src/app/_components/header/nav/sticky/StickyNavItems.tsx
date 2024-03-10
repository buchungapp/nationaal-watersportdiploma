import Link from "next/link";

import Double from "~/app/_components/brand/double-line";
import Logo from "~/app/_components/brand/logo";
import Wordmark from "~/app/_components/brand/wordmark";
import { type NavItems } from "../Nav";
import { MobileNavButton } from "../mobile/MobileNav";
import MoreNav from "./MoreNav";
import { StickyNavDiv } from "./StickyNav";

export default function StickyNavItems({ items }: { items: NavItems }) {
  return (
    <div className={"absolute flex w-full px-4 lg:px-16"}>
      <StickyNavDiv className="bg-white  w-full flex text-branding-dark justify-between font-medium rounded-full">
        <Link href="/" className="flex shrink-0">
          <Logo className="h-24 p-2 w-24 text-white" />
          <Wordmark className="h-24 block lg:hidden xl:block" />
        </Link>
        <div className="lg:hidden flex items-center pr-8">
          <MobileNavButton />
        </div>
        <ul className="hidden w-full items-center justify-end gap-x-12 gap-y-2 lg:flex pr-[48px]">
          {items.map((item) =>
            "items" in item ? (
              <MoreNav key={item.label} items={item.items} label={item.label} />
            ) : (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group relative uppercase flex text-sm flex-nowrap gap-1 py-0.5"
                >
                  {item.icon}
                  {item.label}
                  <Double className="bottom-0 translate-y-full absolute transition-width group-hover:w-full w-0 text-branding-dark" />
                </Link>
              </li>
            ),
          )}
        </ul>
      </StickyNavDiv>
    </div>
  );
}
