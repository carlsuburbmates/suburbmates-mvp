import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

export const firebaseConfig = {
  projectId: 'studio-4393409652-4c3c4',
  appId: '1:853708575737:web:ebfc0663d2e733178de328',
  apiKey: 'AIzaSyCSK-P4AZDpOkGAyJRXJj1_P0wvuPNgxk8',
  authDomain: 'studio-4393409652-4c3c4.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '853708575737',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

// Connect to emulators only when explicitly enabled
const useEmulators =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

if (useEmulators) {
  // Connect to Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8081)

  // Connect to Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099')

  // Connect to Storage emulator
  connectStorageEmulator(storage, 'localhost', 9199)

  console.warn(
    '✅ Connected to Firebase Emulators (controlled by NEXT_PUBLIC_USE_EMULATORS=true)'
  )
} else {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost'
  ) {
    console.warn(
      'ℹ️ Using production Firebase services. Set NEXT_PUBLIC_USE_EMULATORS=true to use emulators locally.'
    )
  }
}

export { app, db, auth, storage }
