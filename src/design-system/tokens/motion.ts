/**
 * Motion tokens: durations and easing curves.
 *
 * Use these for every Animated transition (Dialog fade/scale, Toggle thumb
 * slide, Button press feedback). Keep motion utilitarian and quick: no
 * spring bounce, no glow, no decorative animation.
 */
import { Easing } from 'react-native'

export const motion = {
  duration: {
    /** Micro-feedback: button press, tag press. */
    fast: 120,
    /** Default transition: toggle, tab switch. */
    base: 200,
    /** Entrances/exits: dialog open/close. */
    slow: 320,
  },
  easing: {
    /** Default for most transitions. */
    standard: Easing.bezier(0.4, 0.0, 0.2, 1),
    /** Entrances: starts fast, settles slow. */
    decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
    /** Exits: starts slow, leaves fast. */
    accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  },
} as const

export type MotionDurationToken = keyof typeof motion.duration
export type MotionEasingToken = keyof typeof motion.easing
