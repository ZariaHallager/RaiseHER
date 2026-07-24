'use client'

/**
 * RouteAnnouncer
 *
 * Runs on every client-side route change and does two things:
 *
 * 1. Moves keyboard focus to the page's <h1> so screen-reader and keyboard
 *    users land at the top of the new content rather than wherever focus
 *    happened to be before navigation.
 *
 * 2. Updates a visually-hidden aria-live="polite" region with the new page
 *    title so screen readers announce the navigation to users who are not
 *    in browse mode.
 *
 * Both behaviours are suppressed on the initial render to avoid a spurious
 * announcement when the page first loads.
 */

import { useEffect, useRef } from 'react'
import { usePathname } from '@/i18n/navigation'

export function RouteAnnouncer() {
  const pathname = usePathname()
  const regionRef = useRef<HTMLParagraphElement>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Clear the live region first so screen readers detect the text change
    // when we write the new title into it.
    const region = regionRef.current
    if (region) {
      region.textContent = ''
    }

    // Defer to next tick so the incoming page's DOM has committed.
    const id = window.setTimeout(() => {
      const h1 = document.querySelector<HTMLHeadingElement>('h1')

      // Focus the heading so keyboard navigation resumes from page top.
      if (h1) {
        if (!h1.hasAttribute('tabindex')) {
          h1.setAttribute('tabindex', '-1')
        }
        h1.focus({ preventScroll: false })
      }

      // Announce the new page to assistive technology.
      if (region) {
        region.textContent = document.title ?? (h1?.textContent ?? '')
      }
    }, 100)

    return () => window.clearTimeout(id)
  }, [pathname])

  return (
    <p
      ref={regionRef}
      aria-live="polite"
      aria-atomic="true"
      // Visually hidden but available to the accessibility tree.
      className="sr-only"
    />
  )
}
