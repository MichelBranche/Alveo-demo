import { Capacitor } from '@capacitor/core'

/** Best-effort native shell tweaks; safe no-op on web. */
export async function bootstrapNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const [{ StatusBar, Style }] = await Promise.all([
    import('@capacitor/status-bar').then((m) => ({
      StatusBar: m.StatusBar,
      Style: m.Style,
    })),
  ])

  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#EAE5DF' })
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    /* StatusBar may be unavailable on some webviews */
  }
}
