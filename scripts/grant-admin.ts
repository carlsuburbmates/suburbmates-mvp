import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

function loadEnv() {
  // Try .env.local first, then .env
  const root = process.cwd()
  const envLocal = path.join(root, '.env.local')
  const envDefault = path.join(root, '.env')

  if (fs.existsSync(envLocal)) {
    dotenv.config({ path: envLocal })
  }
  if (fs.existsSync(envDefault)) {
    dotenv.config({ path: envDefault })
  }
}

async function main() {
  loadEnv()

  // Decide target: emulator or production.
  // Default to production unless ADMIN_TARGET=emulator or NEXT_PUBLIC_USE_EMULATOR=true
  const adminTarget = (process.env.ADMIN_TARGET || '').toLowerCase()
  let useEmulator: boolean
  if (adminTarget === 'emulator') {
    useEmulator = true
  } else if (adminTarget === 'prod' || adminTarget === 'production') {
    useEmulator = false
  } else {
    useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true'
  }

  if (!useEmulator) {
    // Ensure we don't accidentally point Admin SDK to local emulators
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST
    delete process.env.FIRESTORE_EMULATOR_HOST
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST
    console.log('[grant-admin] Target: production')
  } else {
    console.log('[grant-admin] Target: emulator')
  }

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!serviceAccountRaw) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY is missing in env')
    process.exit(1)
  }

  let serviceAccount: admin.ServiceAccount
  try {
    serviceAccount = JSON.parse(serviceAccountRaw)
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e)
    process.exit(1)
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  }

  const auth = admin.auth()

  const adminEmail = process.env.ADMIN_EMAIL
  const userUid = process.env.USER_UID

  if (!adminEmail && !userUid) {
    console.error('Provide ADMIN_EMAIL or USER_UID in env to grant admin')
    process.exit(1)
  }

  let targetUid = userUid || ''

  try {
    if (!targetUid && adminEmail) {
      const user = await auth.getUserByEmail(adminEmail)
      targetUid = user.uid
    }

    if (!targetUid) {
      console.error('Unable to resolve target UID')
      process.exit(1)
    }

    await auth.setCustomUserClaims(targetUid, { admin: true })
    console.log(
      JSON.stringify({ ok: true, uid: targetUid, admin: true }, null, 2)
    )
    console.log(
      'Note: The user may need to sign out/in to refresh ID token claims.'
    )
    process.exit(0)
  } catch (err: any) {
    console.error('Grant admin failed:', err?.message || err)
    if (useEmulator) {
      console.error(
        'Hint: If using emulator, ensure it is running (e.g., npm run firebase:emulators).'
      )
    } else {
      console.error(
        'Hint: If you saw ECONNREFUSED earlier, you may have had emulator host envs set. This script now disables them for production.'
      )
    }
    process.exit(1)
  }
}

main()
