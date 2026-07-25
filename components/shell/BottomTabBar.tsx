'use client'

/**
 * BottomTabBar
 *
 * Fixed bottom navigation for the mobile viewport (below the md breakpoint).
 * Hidden on tablet and wider where the TopNav takes over.
 *
 * Each tab item is an accessible link with:
 *   - A geometric SVG icon (aria-hidden, color driven by CSS currentColor).
 *   - A visually-displayed label (aria-hidden to avoid double-reading) backed
 *     by an aria-label on the <a> element for the full accessible name.
 *   - aria-current="page" when the tab matches the active route.
 *
 * Safe-area bottom inset is respected via padding so content is not obscured
 * behind the iOS home indicator.
 */

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { TabIcon, type TabIconName } from '@/components/icons/TabIcons'

const TAB_ITEMS = [
  { labelKey: 'today', icon: 'today' satisfies TabIconName, path: '/today' },
  { labelKey: 'wins', icon: 'wins' satisfies TabIconName, path: '/wins' },
  { labelKey: 'rehearsal', icon: 'rehearsal' satisfies TabIconName, path: '/rehearsal' },
  { labelKey: 'case_files', icon: 'caseFiles' satisfies TabIconName, path: '/case-files' },
  { labelKey: 'circle', icon: 'circle' satisfies TabIconName, path: '/circle' },
  { labelKey: 'profile', icon: 'profile' satisfies TabIconName, path: '/profile' },
] as const

type CommonTabKey = (typeof TAB_ITEMS)[number]['labelKey']

export function BottomTabBar() {
  const t = useTranslations('common')
  const pathname = usePathname()

  return (
    <nav
      aria-label="Tab navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-canvas border-t border-border pb-safe"
    >
      <ul className="flex list-none">
        {TAB_ITEMS.map(({ labelKey, icon, path }) => {
          const isActive =
            pathname === path || pathname.startsWith(path + '/')
          const label = t(labelKey as CommonTabKey)

          return (
            <li key={path} className="flex-1">
              <Link
                href={path}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex flex-col items-center gap-0.5 py-2 px-1',
                  'text-label font-medium transition-colors',
                  isActive ? 'text-accent-deep' : 'text-ink-soft',
                ].join(' ')}
              >
                <TabIcon name={icon} size={22} />
                {/* Label is aria-hidden: the aria-label on the link provides the accessible name. */}
                <span aria-hidden="true" className="text-label leading-none mt-0.5">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
