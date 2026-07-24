'use client'

/**
 * WelcomeCarousel
 *
 * Three-slide accessible carousel using the ARIA tabs/tabpanel pattern.
 * Each dot is a tab button; each slide is a tabpanel.
 *
 * Accessibility:
 *   role="region" + aria-roledescription="carousel" on the container.
 *   role="tablist" on the dot nav, role="tab" on each dot.
 *   role="tabpanel" on each slide, aria-roledescription="slide".
 *   Arrow key, Home, and End navigation on the tablist.
 *   Auto-advance disabled when prefers-reduced-motion: reduce.
 *   Auto-advance pauses on hover and on focus within the carousel.
 *
 * Design: flat geometric accent per slide, no gradients.
 */

import {
  useId,
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react'
import { useTranslations } from 'next-intl'
import { AIMark } from '@/components/ui/AIMark'

// Slide geometric accents: flat fills, matching the TabIcons visual language.
function Accent1() {
  return (
    <svg aria-hidden="true" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="var(--color-accent)" />
    </svg>
  )
}

function Accent2() {
  return (
    <svg aria-hidden="true" width="64" height="64" viewBox="0 0 64 64">
      <rect x="6" y="36" width="14" height="22" rx="3" fill="var(--color-accent)" />
      <rect x="25" y="22" width="14" height="36" rx="3" fill="var(--color-accent)" />
      <rect x="44" y="10" width="14" height="48" rx="3" fill="var(--color-surface-subtle)" />
    </svg>
  )
}

function Accent3() {
  return (
    <div
      aria-hidden="true"
      className="w-16 h-16 rounded-full bg-ai-mark-light border-2 border-ai-mark flex items-center justify-center"
    >
      <AIMark size="md" />
    </div>
  )
}

const ACCENTS = [Accent1, Accent2, Accent3] as const

interface Slide {
  headingKey: 'slide1_heading' | 'slide2_heading' | 'slide3_heading'
  bodyKey: 'slide1_body' | 'slide2_body' | 'slide3_body'
  disclosureKey?: 'slide3_disclosure'
}

const SLIDES: Slide[] = [
  { headingKey: 'slide1_heading', bodyKey: 'slide1_body' },
  { headingKey: 'slide2_heading', bodyKey: 'slide2_body' },
  { headingKey: 'slide3_heading', bodyKey: 'slide3_body', disclosureKey: 'slide3_disclosure' },
]

const AUTO_ADVANCE_MS = 4000

export function WelcomeCarousel() {
  const t = useTranslations('onboarding')
  const id = useId()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion || paused) return
    const timer = setInterval(advance, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [advance, paused, prefersReducedMotion])

  function goTo(index: number) {
    setCurrent(index)
    tabRefs.current[index]?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const count = SLIDES.length
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      goTo((current + 1) % count)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      goTo((current - 1 + count) % count)
    } else if (e.key === 'Home') {
      e.preventDefault()
      goTo(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      goTo(count - 1)
    }
  }

  return (
    <div
      role="region"
      aria-label={t('welcome_title')}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="w-full"
    >
      <div className="relative overflow-hidden">
        {SLIDES.map((slide, i) => {
          const AccentIcon = ACCENTS[i]
          const isActive = current === i
          return (
            <div
              key={slide.headingKey}
              role="tabpanel"
              id={`${id}-panel-${i}`}
              aria-labelledby={`${id}-tab-${i}`}
              aria-roledescription="slide"
              hidden={!isActive}
              className={[
                'flex flex-col items-center text-center gap-5 px-4 py-8',
                !prefersReducedMotion ? 'transition-opacity duration-300' : '',
                isActive ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              <AccentIcon />

              <h2 className="text-headline font-display font-bold text-ink">
                {t(slide.headingKey)}
              </h2>

              <p className="text-body text-ink-soft max-w-sm">
                {t(slide.bodyKey)}
              </p>

              {slide.disclosureKey && (
                <p className="text-caption text-ink-muted max-w-xs">
                  {t(slide.disclosureKey)}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Dot navigation (tabs) */}
      <div
        role="tablist"
        aria-label="Slide navigation"
        className="flex items-center justify-center gap-3 pb-2"
      >
        {SLIDES.map((slide, i) => (
          <button
            key={slide.headingKey}
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={current === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={current === i ? 0 : -1}
            ref={(el) => { tabRefs.current[i] = el }}
            onClick={() => goTo(i)}
            onKeyDown={handleKeyDown}
            className={[
              'rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
              !prefersReducedMotion ? 'duration-200' : '',
              current === i
                ? 'w-6 h-2.5 bg-accent'
                : 'w-2.5 h-2.5 bg-border hover:bg-border-strong',
            ].join(' ')}
          >
            <span className="sr-only">
              {t(slide.headingKey)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
