import Link from "next/link";

import { type NavItem } from "../Nav";

export default function MobileNavItems({ items }: { items: NavItem[] }) {
  return (
    <div className="p-4 overflow-y-auto scrollbar-none">
      {items.map(({ label, href, description, icon }) => (
        <Link
          key={label}
          href={href}
          className="relative block border-b-2 border-slate-100 p-4 transition-colors hover:bg-branding-section"
        >
          <div className="flex gap-1 font-semibold text-branding-dark">
            {icon}
            {label}
          </div>
          <p className="mt-1 font-normal normal-case text-branding">{description}</p>
        </Link>
      ))}
    </div>
  );
}
