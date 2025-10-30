'use client'

import { firebaseConfig } from '@/firebase/config'
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp()
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          'Automatic initialization failed. Falling back to firebase config object.',
          e
        )
      }
      firebaseApp = initializeApp(firebaseConfig)
    }

    // Initialize App Check
    if (typeof window !== 'undefined') {
      // Use Firebase App Check debug token in non-production to avoid reCAPTCHA blockers
      if (process.env.NODE_ENV !== 'production') {
        // @ts-expect-error: FIREBASE_APPCHECK_DEBUG_TOKEN is a global used for App Check debugging in dev
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
        const existingDebugToken = localStorage.getItem(
          'firebase-app-check-debug-token'
        )
        if (!existingDebugToken) {
          console.warn(
            [
              'Firebase App Check debug token not yet registered.',
              'A fresh token will appear in this console after reload.',
              'Copy it and add it under App Check → Debug tokens for project studio-4393409652-4c3c4.',
            ].join(' ')
          )
        } else {
          console.warn(
            'Firebase App Check debug token in use:',
            existingDebugToken,
            '(ensure it is registered in App Check → Debug tokens).'
          )
        }
      }
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      if (siteKey) {
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        })
        console.warn('Firebase App Check initialized.')
      } else {
        console.warn(
          'Firebase App Check not initialized: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set.'
        )
      }
    }

    return getSdks(firebaseApp)
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp())
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  }
}

export * from './provider'
export * from './client-provider'
export * from './firestore/use-collection'
export * from './firestore/use-doc'
export * from './non-blocking-updates'
export * from './non-blocking-login'
export * from './errors'
export * from './error-emitter'
