import { NextResponse } from 'next/server'
import { getAdminServices } from '@/lib/firebase-admin'
import { logInfo, logError } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  const env = process.env.NODE_ENV || 'development'

  try {
    const { auth, db, storage } = await getAdminServices()

    // Firestore ping
    let firestoreOk = false
    let firestoreLatencyMs = null as number | null
    try {
      const fsStart = Date.now()
      await db
        .collection('monitoring')
        .doc('health')
        .set({ lastPingAt: new Date().toISOString() }, { merge: true })
      const doc = await db.collection('monitoring').doc('health').get()
      firestoreOk = doc.exists
      firestoreLatencyMs = Date.now() - fsStart
    } catch (e) {
      logError('health.firestore_error', e)
    }

    // Auth ping (list minimal users to validate connectivity/permissions)
    let authOk = false
    let authLatencyMs = null as number | null
    try {
      const auStart = Date.now()
      const list = await auth.listUsers(1)
      authOk = Array.isArray(list.users)
      authLatencyMs = Date.now() - auStart
    } catch (e) {
      logError('health.auth_error', e)
    }

    // Storage ping (bucket existence)
    let storageOk = false
    let storageLatencyMs = null as number | null
    try {
      const stStart = Date.now()
      const bucketName =
        process.env.FIREBASE_STORAGE_BUCKET ||
        `${process.env.FIREBASE_PROJECT_ID || 'studio-4393409652-4c3c4'}.appspot.com`
      const [exists] = await storage.bucket(bucketName).exists()
      storageOk = !!exists
      storageLatencyMs = Date.now() - stStart
    } catch (e) {
      // Storage not configured is acceptable depending on project settings
      logError('health.storage_error', e)
    }

    const status = firestoreOk && authOk ? 'ok' : 'degraded'
    const totalLatencyMs = Date.now() - started

    const result = {
      status,
      env,
      checks: {
        firestore: { ok: firestoreOk, latencyMs: firestoreLatencyMs },
        auth: { ok: authOk, latencyMs: authLatencyMs },
        storage: { ok: storageOk, latencyMs: storageLatencyMs },
      },
      totalLatencyMs,
      timestamp: new Date().toISOString(),
    }

    logInfo('health.result', result)
    return NextResponse.json(result, { status: status === 'ok' ? 200 : 503 })
  } catch (err: any) {
    logError('health.fatal_error', err)
    return NextResponse.json(
      { status: 'error', env, error: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
