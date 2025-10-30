'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/firebase'

// Bridges Firebase client auth to a secure HttpOnly session cookie for server-side checks
export function AuthSessionBridge() {
  const auth = useAuth()
  const lastUidRef = useRef<string | null>(null)

  useEffect(() => {
    const syncSession = async () => {
      const user = auth?.currentUser || null
      const uid = user?.uid || null
      if (uid && lastUidRef.current === uid) return // avoid redundant sync
      try {
        if (user) {
          const idToken = await user.getIdToken()
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
          })
          lastUidRef.current = uid
        } else {
          await fetch('/api/auth/session', { method: 'DELETE' })
          lastUidRef.current = null
        }
      } catch (e) {
        // Swallow errors; UI still operates on client auth
      }
    }
    syncSession()
  }, [auth?.currentUser])

  return null
}
