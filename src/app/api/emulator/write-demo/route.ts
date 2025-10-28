import { NextResponse } from 'next/server';
import { getApps, initializeApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST() {
  try {
    // Ensure we talk to the local Firestore emulator
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8081';

    let app: App;
    if (!getApps().length) {
      // For emulator, admin SDK can initialize without credentials if projectId is set
      app = initializeApp({ projectId: 'studio-4393409652-4c3c4' });
    } else {
      app = getApps()[0];
    }

    const db = getFirestore(app);
    const docRef = await db.collection('demoWrites').add({
      message: 'Hello Emulator',
      createdAt: new Date().toISOString(),
      source: 'api/emulator/write-demo'
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';