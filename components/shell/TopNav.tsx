'use client'

/**
 * TopNav
 *
 * Sticky top navigation bar, visible from the tablet breakpoint (md) upward.
 * Hidden on mobile where the BottomTabBar takes over.
 *
 * Structure:
 *   <header>
 *     <nav aria-label="Main navigation">
 *       Brand mark | Nav links (context-aware) | Auth controls
 *     </nav>
 *   </header>
 *
 * Signed-out visitors: brand + Pricing link + Sign in / Get started.
 * Signed-in users: brand + full app nav + UserButton.
 *
 * Active state: driven by usePathname (next-intl, locale-stripped).
 * Auth state: driven by Clerk's SignedIn/SignedOut helpers.
 */

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

const APP_NAV_ITEMS = [
  { labelKey: 'today', path: '/today' },
  { labelKey: 'wins', path: '/wins' },
  { labelKey: 'rehearsal', path: '/rehearsal' },
  { labelKey: 'case_files', path: '/case-files' },
  { labelKey: 'circle', path: '/circle' },
] as const

type CommonNavKey = (typeof APP_NAV_ITEMS)[number]['labelKey']

function NavLink({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'px-3 py-1.5 rounded-sm text-caption font-medium transition-colors',
        isActive
          ? 'bg-surface-subtle text-ink'
          : 'text-ink-soft hover:text-ink hover:bg-surface-subtle',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}

export function TopNav() {
  const tc = useTranslations('common')
  const to = useTranslations('onboarding')
  const tm = useTranslations('marketing')
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 hidden md:block bg-canvas border-b border-border">
      <div className="max-w-5xl mx-auto px-6">
        <nav
          aria-label="Main navigation"
          className="h-14 flex items-center gap-6"
        >
          {/* Brand */}
          <Link
            href="/"
            className="shrink-0 text-body font-bold text-ink focus-visible:outline-accent-deep"
          >
            {tc('app_name')}
          </Link>

          {/* App nav links: only shown when signed in */}
          <SignedIn>
            <ul className="flex items-center gap-1 list-none flex-1">
              {APP_NAV_ITEMS.map(({ labelKey, path }) => {
                const isActive =
                  pathname === path || pathname.startsWith(path + '/')
                return (
                  <li key={path}>
                    <NavLink href={path} isActive={isActive}>
                      {tc(labelKey as CommonNavKey)}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </SignedIn>

          {/* Marketing nav links: only shown when signed out */}
          <SignedOut>
            <ul className="flex items-center gap-1 list-none flex-1">
              <li>
                <NavLink href="/pricing" isActive={pathname === '/pricing'}>
                  {tm('nav_pricing')}
                </NavLink>
              </li>
            </ul>
          </SignedOut>

          {/* Auth controls */}
          <div className="flex items-center gap-3 shrink-0">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="px-4 py-1.5 rounded-sm text-caption font-medium text-ink-soft hover:text-ink transition-colors"
              >
                {to('sign_in')}
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-1.5 rounded-sm bg-accent text-on-accent text-caption font-semibold transition-opacity hover:opacity-90"
              >
                {to('sign_up')}
              </Link>
            </SignedOut>
          </div>
        </nav>
      </div>
    </header>
  )
}
