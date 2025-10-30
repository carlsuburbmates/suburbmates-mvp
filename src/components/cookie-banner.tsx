'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const CONSENT_KEY = 'cookie-consent-prefs'

type ConsentPrefs = {
  accepted: boolean
  categories: {
    analytics: boolean
    preferences: boolean
  }
  ts: number
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [preferences, setPreferences] = useState(true)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONSENT_KEY)
      if (!raw) {
        setVisible(true)
      } else {
        const parsed: ConsentPrefs = JSON.parse(raw)
        setAnalytics(!!parsed.categories?.analytics)
        setPreferences(!!parsed.categories?.preferences)
      }
    } catch {
      setVisible(true)
    }

    const open = () => setVisible(true)
    window.addEventListener('open-cookie-banner', () => open())
    return () => window.removeEventListener('open-cookie-banner', () => open())
  }, [])

  function save(prefs: Partial<ConsentPrefs>['categories'], accepted = true) {
    try {
      const toStore: ConsentPrefs = {
        accepted,
        categories: {
          analytics: prefs?.analytics ?? analytics,
          preferences: prefs?.preferences ?? preferences,
        },
        ts: Date.now(),
      }
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(toStore))
    } catch {}
    setVisible(false)
  }

  function acceptAll() {
    save({ analytics: true, preferences: true }, true)
  }

  function rejectNonEssential() {
    save({ analytics: false, preferences: false }, true)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4">
      <div className="mx-auto max-w-4xl rounded-lg border bg-card p-4 shadow-lg">
        <div className="text-sm text-muted-foreground">
          <p>
            We use cookies to operate the site, personalize content, and analyze
            traffic. Read our{' '}
            <Link href="/cookies" className="underline text-foreground">
              Cookie Policy
            </Link>
            .
          </p>
        </div>

        {advanced && (
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-foreground">Analytics cookies</Label>
                <p className="text-xs text-muted-foreground">
                  Help us understand usage to improve the experience.
                </p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-foreground">Preference cookies</Label>
                <p className="text-xs text-muted-foreground">
                  Remember settings like theme or location.
                </p>
              </div>
              <Switch checked={preferences} onCheckedChange={setPreferences} />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-end">
          {!advanced && (
            <Button variant="outline" onClick={() => setAdvanced(true)}>
              Manage preferences
            </Button>
          )}
          {advanced && (
            <Button
              variant="secondary"
              onClick={() => save({ analytics, preferences }, true)}
            >
              Save
            </Button>
          )}
          <Button variant="secondary" onClick={rejectNonEssential}>
            Reject non‑essential
          </Button>
          <Button onClick={acceptAll}>Accept all</Button>
        </div>
      </div>
    </div>
  )
}
