import clsx from "clsx";
import Link from "next/link";

import Double from "~/app/_assets/Double";
import { type NavItem } from "../Nav";
import MoreNav from "./MoreNav";

export default function StickyNavItemList({
  itemsMore,
  items,
}: {
  itemsMore?: NavItem[];
  items: NavItem[];
}) {
  return (
    <div className={clsx("flex items-center gap-12")}>
      {itemsMore && itemsMore.length > 0 && <MoreNav items={itemsMore} />}
      {items.map(({ label, href, icon }) => (
        <li key={label}>
          <Link href={href} className="group relative flex flex-nowrap gap-1 py-0.5">
            {icon}
            {label}
            <Double className="w-full bottom-0 translate-y-full absolute text-transparent transition-colors group-hover:text-branding-dark" />
          </Link>
        </li>
      ))}
    </div>
  );
}
