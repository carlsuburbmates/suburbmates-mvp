'use server'

import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

type AdminServices = {
  auth: ReturnType<typeof getAuth>
  db: ReturnType<typeof getFirestore>
  storage: ReturnType<typeof getStorage>
}

let services: AdminServices | null = null

export async function getAdminServices(): Promise<AdminServices> {
  if (services) return services

  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (!raw) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY is required to initialize Firebase Admin.'
      )
    }
    const serviceAccount = JSON.parse(raw)
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  }

  services = {
    auth: getAuth(),
    db: getFirestore(),
    storage: getStorage(),
  }
  return services
}
