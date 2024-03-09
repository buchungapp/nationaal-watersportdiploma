import Link from "next/link";

import { NavItem, type NavItems } from "../Nav";

export default function MobileNavItems({ items }: { items: NavItems }) {
  return (
    <div className="p-4 overflow-y-auto scrollbar-none divide-y-2 divide-slate-100">
      {items.map((item) =>
        "items" in item ? (
          <div>
            <div className="flex gap-1 px-4 pt-4 font-semibold text-branding-dark">
              {item.label}
            </div>
            <div className="text-sm">
              <Items items={item.items} />
            </div>
          </div>
        ) : (
          <Items items={[item]} />
        ),
      )}
    </div>
  );
}

function Items({ items }: { items: NavItem[] }) {
  return items.map((item) => (
    <Link
      key={item.label}
      href={item.href}
      className="relative block p-4 transition-colors hover:bg-branding-section"
    >
      <div className="flex gap-1 font-semibold text-branding-dark">
        {item.icon}
        {item.label}
      </div>
      <p className="mt-1 font-normal normal-case text-branding">{item.description}</p>
    </Link>
  ));
}
