'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { load, trackPageview } from 'fathom-client'

function TrackPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' &&
      !!process.env.NEXT_PUBLIC_FATHOM_ID
    ) {
      load(process.env.NEXT_PUBLIC_FATHOM_ID, {
        auto: false,
      })
    }
  }, [])

  // Record a pageview when route changes
  useEffect(() => {
    if (pathname) {
      trackPageview({
        url: pathname + `?${searchParams.toString()}`,
        referrer: document.referrer,
      })
    }
  }, [pathname, searchParams])

  return null
}

export default function Analytics() {
  return (
    <Suspense>
      <TrackPageView />
    </Suspense>
  )
}
