import Link from "next/link";

import Double from "~/app/_assets/Double";
import Hero from "~/app/_assets/Hero";
import Logo from "~/app/_assets/Logo";
import { type NavItems } from "../Nav";
import { MobileNavButton } from "../mobile/MobileNav";
import MoreNav from "./MoreNav";
import { StickyNavDiv } from "./StickyNav";

export default function StickyNavItems({ items }: { items: NavItems }) {
  return (
    <div className={"absolute flex w-full px-4 lg:px-16"}>
      <StickyNavDiv className="bg-white  w-full flex text-branding-dark justify-between uppercase font-medium text-sm rounded-full">
        <Link href="/" className="flex shrink-0">
          <Logo className="h-24 p-2 w-24 text-white" />
          <Hero className="h-24" />
        </Link>
        <div className="lg:hidden flex items-center pr-8">
          <MobileNavButton />
        </div>
        <ul className="hidden w-full items-center justify-end gap-x-12 gap-y-2 lg:flex pr-8">
          {items.map((item) =>
            "items" in item ? (
              <MoreNav key={item.label} items={item.items} label={item.label} />
            ) : (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group relative flex flex-nowrap gap-1 py-0.5 tracking-widest"
                >
                  {item.icon}
                  {item.label}
                  <div className="w-full absolute transition-transform group-hover:translate-x-0 translate-x-[50%] bottom-0 translate-y-full">
                    <Double className="group-hover:w-full w-0 transition-width text-branding-dark" />
                  </div>
                </Link>
              </li>
            ),
          )}
        </ul>
      </StickyNavDiv>
    </div>
  );
}
