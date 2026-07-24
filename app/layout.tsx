/**
 * Root layout: minimal shell required by Next.js when a root page exists.
 * The middleware redirects all real traffic to /[locale]/*, so this layout
 * is only reached by the root redirect page below.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
