'use client'

import { useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────
// Native app bridge.
//
// The GRH mobile app is a Capacitor shell that loads this site directly,
// which means the Capacitor runtime (window.Capacitor) is injected into
// our pages when — and only when — we're running inside the app. This
// component is a no-op in normal browsers.
//
// Responsibilities:
//   1. Ask for notification permission and register the device token
//      against the signed-in user (POST /api/push/register).
//   2. Navigate when the user taps a push notification.
//
// Mounted in the pharmacy dashboard layout so it only runs for
// authenticated users.
// ─────────────────────────────────────────────────────────────────────────

interface PushPlugin {
  checkPermissions(): Promise<{ receive: string }>
  requestPermissions(): Promise<{ receive: string }>
  register(): Promise<void>
  addListener(
    event: string,
    cb: (data: never) => void,
  ): Promise<unknown>
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins?: { PushNotifications?: PushPlugin }
}

function getCapacitor(): CapacitorGlobal | undefined {
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor
}

export default function AppBridge() {
  useEffect(() => {
    const cap = getCapacitor()
    if (!cap?.isNativePlatform?.()) return

    const push = cap.Plugins?.PushNotifications
    if (!push) return

    const platform = cap.getPlatform?.() === 'ios' ? 'ios' : 'android'

    async function setup(p: PushPlugin) {
      try {
        // Token arrives via this listener after register()
        await p.addListener('registration', (data: never) => {
          const token = (data as { value?: string })?.value
          if (!token) return
          fetch('/api/push/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, platform }),
          }).catch(() => {})
        })

        // Tapping a notification navigates to the URL in its payload
        await p.addListener('pushNotificationActionPerformed', (action: never) => {
          const a = action as {
            notification?: { data?: { url?: string } }
          }
          const url = a?.notification?.data?.url
          if (typeof url === 'string' && url.startsWith('/')) {
            window.location.href = url
          }
        })

        let { receive } = await p.checkPermissions()
        if (receive === 'prompt' || receive === 'prompt-with-rationale') {
          receive = (await p.requestPermissions()).receive
        }
        if (receive === 'granted') {
          await p.register()
        }
      } catch {
        // Push is a nice-to-have — never let it break the dashboard
      }
    }

    void setup(push)
  }, [])

  return null
}
