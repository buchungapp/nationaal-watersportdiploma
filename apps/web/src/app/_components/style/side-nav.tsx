'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export default function SideNav({
  label,
  items,
  className,
}: {
  label: string
  items: { label: string; href: string }[]
  className?: string
}) {
  const pathname = usePathname()

  return (
    <div className={twMerge('flex flex-col gap-2 text-sm', className)}>
      <span className="ml-4 text-sm font-semibold">{label}</span>
      <ul className="flex flex-col gap-3">
        {items.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={clsx(
                'block rounded-lg px-4 py-1.5 text-branding-dark transition-colors',
                pathname === href
                  ? 'bg-gray-100 font-semibold'
                  : 'hover:bg-gray-100',
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
