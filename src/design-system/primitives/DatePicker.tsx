/**
 * DatePicker primitive.
 *
 * Custom month-grid calendar rendered inside the design system Dialog: no
 * default native date picker UI. Month/weekday names use Intl.DateTimeFormat
 * so the calendar reads correctly in every supported locale.
 *
 * Navigation arrows are drawn from a plain View border triangle, matching
 * the "no default system icons" rule used for the tab bar icon set.
 */
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme'
import { Dialog } from './Dialog'

interface DatePickerProps {
  label?: string
  value: Date | null
  onChange: (date: Date) => void
  minimumDate?: Date
  maximumDate?: Date
  placeholder?: string
  previousMonthLabel?: string
  nextMonthLabel?: string
}

const DAY_CELL_SIZE = 40
const DAY_DOT_SIZE = 32

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function DatePicker({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholder,
  previousMonthLabel = 'Previous month',
  nextMonthLabel = 'Next month',
}: DatePickerProps) {
  const { colors, spacing, radii, typography } = useTheme()
  const { i18n } = useTranslation()
  const locale = i18n.language

  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => startOfMonth(value ?? new Date()))

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale])
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale]
  )
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short' }), [locale])

  const weekdayLabels = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekdayFormatter.format(new Date(1970, 0, 5 + i))),
    [weekdayFormatter]
  )

  const gridDays = useMemo(() => {
    const first = startOfMonth(visibleMonth)
    const total = daysInMonth(visibleMonth)
    const firstWeekdayOffset = (first.getDay() + 6) % 7 // Monday-first grid
    const cells: (Date | null)[] = []
    for (let i = 0; i < firstWeekdayOffset; i++) cells.push(null)
    for (let day = 1; day <= total; day++) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
    }
    return cells
  }, [visibleMonth])

  const isDisabled = (date: Date): boolean => {
    if (minimumDate && date < minimumDate) return true
    if (maximumDate && date > maximumDate) return true
    return false
  }

  const goToMonth = (delta: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  return (
    <View style={{ gap: spacing[1] }}>
      {label ? <Text style={[typography.label, { color: colors.inkSoft }]}>{label}</Text> : null}

      <Pressable
        onPress={() => setIsOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
          },
        ]}
      >
        <Text style={[typography.body, { color: value ? colors.ink : colors.inkMuted }]}>
          {value ? dateFormatter.format(value) : placeholder ?? ''}
        </Text>
      </Pressable>

      <Dialog visible={isOpen} onRequestClose={() => setIsOpen(false)}>
        <View style={styles.header}>
          <Pressable
            onPress={() => goToMonth(-1)}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel={previousMonthLabel}
          >
            <View style={[styles.arrow, styles.arrowLeft, { borderRightColor: colors.ink }]} />
          </Pressable>
          <Text style={[typography.subhead, { color: colors.ink }]}>{monthFormatter.format(visibleMonth)}</Text>
          <Pressable
            onPress={() => goToMonth(1)}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel={nextMonthLabel}
          >
            <View style={[styles.arrow, styles.arrowRight, { borderLeftColor: colors.ink }]} />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {weekdayLabels.map((weekdayLabel, index) => (
            <Text key={index} style={[typography.caption, styles.weekdayCell, { color: colors.inkMuted }]}>
              {weekdayLabel}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {gridDays.map((date, index) => {
            if (!date) return <View key={index} style={styles.dayCell} />
            const selected = value ? isSameDay(date, value) : false
            const disabled = isDisabled(date)
            return (
              <Pressable
                key={index}
                disabled={disabled}
                onPress={() => {
                  onChange(date)
                  setIsOpen(false)
                }}
                style={styles.dayCell}
              >
                <View style={[styles.dayDot, selected && { backgroundColor: colors.ink }]}>
                  <Text
                    style={[
                      typography.body,
                      {
                        color: disabled ? colors.inkMuted : selected ? colors.inkInverse : colors.ink,
                        opacity: disabled ? 0.4 : 1,
                      },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </Dialog>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { borderWidth: 1.5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: { padding: 8 },
  arrow: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  arrowLeft: { borderRightWidth: 8 },
  arrowRight: { borderLeftWidth: 8 },
  weekdayRow: { flexDirection: 'row' },
  weekdayCell: { width: DAY_CELL_SIZE, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: DAY_CELL_SIZE, height: DAY_CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  dayDot: {
    width: DAY_DOT_SIZE,
    height: DAY_DOT_SIZE,
    borderRadius: DAY_DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
