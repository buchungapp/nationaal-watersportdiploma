'use client'

import { Fragment, useState, type ComponentPropsWithoutRef } from 'react'
import { Transition } from '@headlessui/react'
import { twMerge } from 'tailwind-merge'

export default function CopyToClipboard({
  children,
  value,
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & { value: string }) {
  const [showing, setShowing] = useState(false)
  return (
    <span className="relative">
      <button
        {...props}
        onClick={async (e) => {
          if (typeof navigator.clipboard === 'undefined') return
          await navigator.clipboard.writeText(value)
          props.onClick?.(e)

          setShowing(true)
          setTimeout(() => setShowing(false), 400)
          return
        }}
        className={twMerge(
          'rounded-lg transition-[padding,margin,background-color] hover:-mx-2 hover:bg-gray-100 hover:px-2',
          className,
        )}
      >
        {children}
      </button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
        show={showing}
      >
        <span className="absolute left-1/2 top-0 z-10 -mt-2 -translate-x-1/2 -translate-y-full">
          <span className="rounded-lg bg-branding-dark px-2 py-1 shadow-lg">
            <span className="text-sm font-semibold text-white">Gekopieerd</span>
          </span>
        </span>
      </Transition>
    </span>
  )
}
