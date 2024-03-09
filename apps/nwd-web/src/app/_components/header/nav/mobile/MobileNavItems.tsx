import Link from "next/link";

import clsx from "clsx";
import { NavItem, type NavItems } from "../Nav";

export default function MobileNavItems({ items }: { items: NavItems }) {
  return (
    <div className="p-4 overflow-y-auto scrollbar-none divide-y-2 divide-slate-100">
      {items.map((item) =>
        "items" in item ? (
          <div key={item.label} className="gap-2 flex flex-col py-4">
            <div className="flex gap-1 px-4 font-semibold">{item.label}</div>
            <div className="text-sm">
              {item.items.map((subItem) => (
                <Item key={subItem.label} item={subItem} className="px-4 py-0.5" />
              ))}
            </div>
          </div>
        ) : (
          <Item key={item.label} item={item} className="p-4" />
        ),
      )}
    </div>
  );
}

function Item({ item, className }: { item: NavItem; className?: string }) {
  return (
    <Link
      href={item.href}
      className={clsx("relative block transition-colors hover:bg-branding-section", className)}
    >
      <div className="flex gap-1 font-semibold text-branding-dark">
        {item.icon}
        {item.label}
      </div>
      <p className="mt-1 font-normal normal-case text-branding">{item.description}</p>
    </Link>
  );
}
