import Link from "next/link";

import { NavItem, type NavItems } from "../Nav";

export default function MobileNavItems({ items }: { items: NavItems }) {
  return (
    <div className="p-4 overflow-y-auto scrollbar-none divide-y-2 divide-slate-100">
      {items.map((item) =>
        "items" in item ? (
          <div key={item.label}>
            <div className="flex gap-1 px-4 pt-4 font-semibold text-branding-dark">
              {item.label}
            </div>
            <div className="text-sm">
              {item.items.map((subItem) => (
                <Item key={subItem.label} item={subItem} />
              ))}
            </div>
          </div>
        ) : (
          <Item key={item.label} item={item} />
        ),
      )}
    </div>
  );
}

function Item({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="relative block p-4 transition-colors hover:bg-branding-section"
    >
      <div className="flex gap-1 font-semibold text-branding-dark">
        {item.icon}
        {item.label}
      </div>
      <p className="mt-1 font-normal normal-case text-branding">{item.description}</p>
    </Link>
  );
}
