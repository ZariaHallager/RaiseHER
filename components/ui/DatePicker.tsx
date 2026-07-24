'use client'

/**
 * DatePicker primitive, web version.
 *
 * Custom month-grid calendar following the ARIA APG "Date Picker Dialog"
 * keyboard pattern (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 * examples/datepicker-dialog/).
 *
 * Grid keyboard navigation:
 *   ArrowLeft / ArrowRight   : prev / next day
 *   ArrowUp / ArrowDown      : prev / next week (same weekday)
 *   Home / End               : first / last day of the current week row
 *   Page Up                  : previous month
 *   Shift + Page Up          : previous year
 *   Page Down                : next month
 *   Shift + Page Down        : next year
 *   Enter / Space            : select focused date and close
 *   Escape                   : close without selecting (Dialog handles this)
 *
 * When the dialog opens, focus moves to the selected date. If no date is
 * selected, focus moves to today. The grid uses a roving tabindex so only
 * the focused cell is in the tab sequence.
 *
 * Month and weekday labels use Intl.DateTimeFormat so all four locales
 * (en, es, fr, pt) render natively.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react' // useCallback used by isDisabledDate, selectDate
import { Dialog } from './Dialog'

/* Date utilities */

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

function addDays(d: Date, delta: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + delta)
  return r
}

function addMonths(d: Date, delta: number): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() + delta)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Monday-first weekday offset (0 = Mon, 6 = Sun). */
function mondayOffset(d: Date): number {
  return (d.getDay() + 6) % 7
}

/** First day of the ISO week (Monday) containing d. */
function startOfWeek(d: Date): Date {
  return addDays(d, -mondayOffset(d))
}

/** Last day of the ISO week (Sunday) containing d. */
function endOfWeek(d: Date): Date {
  return addDays(d, 6 - mondayOffset(d))
}

/* Component */

interface DatePickerProps {
  label?: string
  value: Date | null
  onChange: (date: Date) => void
  minimumDate?: Date
  maximumDate?: Date
  placeholder?: string
  id?: string
  /** Locale BCP-47 tag. Defaults to navigator.language or 'en'. */
  locale?: string
}

const DAY_CELL = 40 // px, matches min touch target
const DAY_DOT = 32 // px inner circle

export function DatePicker({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholder,
  id: idProp,
  locale: localeProp,
}: DatePickerProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const headingId = `${id}-heading`

  const locale =
    localeProp ??
    (typeof navigator !== 'undefined' ? navigator.language : 'en')

  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(() =>
    startOfMonth(value ?? new Date()),
  )
  const [focusedDate, setFocusedDate] = useState<Date>(() => value ?? new Date())

  const gridRef = useRef<HTMLDivElement>(null)

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
    [locale],
  )
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  )
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'short' }),
    [locale],
  )

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        weekdayFormatter.format(new Date(1970, 0, 5 + i)),
      ),
    [weekdayFormatter],
  )

  const gridDays = useMemo(() => {
    const first = startOfMonth(visibleMonth)
    const total = daysInMonth(visibleMonth)
    const offset = mondayOffset(first)
    const cells: (Date | null)[] = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let day = 1; day <= total; day++) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
    }
    return cells
  }, [visibleMonth])

  // When the dialog opens, snap focus and visible month to the current value (or today).
  // Captured in a ref so the effect does not re-run on every `value` change while open.
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (isOpen) {
      const initial = valueRef.current ?? new Date()
      setFocusedDate(initial)
      setVisibleMonth(startOfMonth(initial))
    }
  }, [isOpen])

  // After focusedDate changes, imperatively focus the corresponding cell.
  useEffect(() => {
    if (!isOpen) return
    const raf = requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLElement>('[data-focused-day="true"]')
        ?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [focusedDate, isOpen])

  const isDisabledDate = useCallback(
    (d: Date): boolean => {
      if (minimumDate && d < minimumDate) return true
      if (maximumDate && d > maximumDate) return true
      return false
    },
    [minimumDate, maximumDate],
  )

  const selectDate = useCallback(
    (d: Date) => {
      if (!isDisabledDate(d)) {
        onChange(d)
        setIsOpen(false)
      }
    },
    [isDisabledDate, onChange],
  )


  const handleDayKeyDown = (e: React.KeyboardEvent, date: Date) => {
    let next: Date | null = null

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        next = addDays(date, -1)
        break
      case 'ArrowRight':
        e.preventDefault()
        next = addDays(date, 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        next = addDays(date, -7)
        break
      case 'ArrowDown':
        e.preventDefault()
        next = addDays(date, 7)
        break
      case 'Home':
        e.preventDefault()
        next = startOfWeek(date)
        break
      case 'End':
        e.preventDefault()
        next = endOfWeek(date)
        break
      case 'PageUp':
        e.preventDefault()
        next = addMonths(date, e.shiftKey ? -12 : -1)
        break
      case 'PageDown':
        e.preventDefault()
        next = addMonths(date, e.shiftKey ? 12 : 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        selectDate(date)
        break
    }

    if (next) {
      setFocusedDate(next)
      setVisibleMonth(startOfMonth(next))
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-label font-semibold tracking-wide text-ink-soft"
        >
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className={[
          'w-full text-left text-body rounded-lg px-4 py-3',
          'bg-surface border-[1.5px] border-border',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
          value ? 'text-ink' : 'text-ink-muted',
        ].join(' ')}
      >
        {value ? dateFormatter.format(value) : (placeholder ?? 'Select a date')}
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        aria-labelledby={headingId}
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
            className="p-2 rounded-sm hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <h2
            id={headingId}
            className="text-subhead font-semibold text-ink"
            aria-live="polite"
          >
            {monthFormatter.format(visibleMonth)}
          </h2>

          <button
            type="button"
            aria-label="Next month"
            onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-sm hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div role="row" className="grid grid-cols-7 mb-1" aria-hidden="true">
          {weekdayLabels.map((lbl, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-caption text-ink-muted font-semibold"
              style={{ width: DAY_CELL, height: 28 }}
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          ref={gridRef}
          role="grid"
          aria-labelledby={headingId}
          className="grid grid-cols-7"
        >
          {gridDays.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  role="gridcell"
                  aria-hidden="true"
                  style={{ width: DAY_CELL, height: DAY_CELL }}
                />
              )
            }

            const isSelected = value ? isSameDay(date, value) : false
            const isFocused = isSameDay(date, focusedDate)
            const isDisabled = isDisabledDate(date)
            const isToday = isSameDay(date, new Date())
            const fullLabel = new Intl.DateTimeFormat(locale, {
              dateStyle: 'full',
            }).format(date)

            return (
              <div
                key={date.toISOString()}
                role="gridcell"
                aria-selected={isSelected}
                aria-disabled={isDisabled || undefined}
              >
                <button
                  type="button"
                  tabIndex={isFocused ? 0 : -1}
                  data-focused-day={isFocused ? 'true' : undefined}
                  disabled={isDisabled}
                  aria-label={fullLabel}
                  onClick={() => selectDate(date)}
                  onKeyDown={(e) => handleDayKeyDown(e, date)}
                  className={[
                    'flex items-center justify-center rounded-full',
                    'text-body transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-deep',
                    isSelected
                      ? 'bg-ink text-ink-inverse'
                      : isToday
                        ? 'border-[1.5px] border-accent-deep text-ink'
                        : 'text-ink hover:bg-surface-subtle',
                    isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ width: DAY_DOT, height: DAY_DOT }}
                >
                  {date.getDate()}
                </button>
              </div>
            )
          })}
        </div>
      </Dialog>
    </div>
  )
}
