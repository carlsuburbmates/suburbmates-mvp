'use client'

import { useState, useEffect } from 'react'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'
import { toast } from '@/hooks/use-toast'

/**
 * Enhanced error listener component that provides user-friendly error feedback
 * while maintaining the original error boundary functionality.
 */
export function FirebaseErrorListener() {
  // Use the specific error type for the state for type safety.
  const [error, setError] = useState<FirestorePermissionError | null>(null)

  useEffect(() => {
    // The callback now expects a strongly-typed error, matching the event payload.
    const handleError = (error: FirestorePermissionError) => {
      // Set error in state to trigger a re-render.
      setError(error)

      // Show user-friendly toast notification for permission errors
      if (typeof window !== 'undefined') {
        toast({
          title: 'Access Issue',
          description:
            "You don't have permission to view this content. Please sign in or contact support if you believe this is an error.",
          variant: 'destructive',
        })
      }
    }

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError)

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError)
    }
  }, [])

  // On re-render, if an error exists in state, throw it.
  if (error) {
    // In production, surface the error to Next.js's global error boundary.
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
    // In non-production environments, suppress throwing to avoid breaking pages
    // when emulators or permissions are not configured. Log conspicuously.
    if (typeof window !== 'undefined') {
      // Visible, high-signal warning to catch attention during dev/test.
      console.warn(
        '⚠️ [FirebaseErrorListener] Firestore permission error suppressed (non-prod). Check rules/emulators.'
      )
      console.error(error)
    }
  }

  // This component renders nothing.
  return null
}
