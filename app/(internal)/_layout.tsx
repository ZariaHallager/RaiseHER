/**
 * Internal routes layout (founder-only tools).
 * Auth check is delegated to each screen.
 */
import { Stack } from 'expo-router'

export default function InternalLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
