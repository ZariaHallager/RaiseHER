/**
 * Locale-aware navigation helpers (next-intl).
 *
 * These wrappers encode the active locale prefix automatically, so callers
 * use plain pathnames like '/wins' and the link/redirect arrives at '/es/wins'.
 *
 * Usage:
 *   import { Link, redirect, usePathname, useRouter } from '@/i18n/navigation'
 *
 * Or via the barrel:
 *   import { Link, useRouter } from '@/i18n'
 */
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
