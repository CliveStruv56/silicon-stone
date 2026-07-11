// Helper defined by the inline no-flash theme script in src/app/layout.tsx.
// Syncs <meta name="theme-color"> with the class-based theme preference.
interface Window {
  __ssThemeColor?: () => void
}
