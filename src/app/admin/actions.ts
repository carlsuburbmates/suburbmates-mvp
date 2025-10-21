'use server';

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, doc, updateDoc } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

async function verifyAdmin(): Promise<void> {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const idToken = authorization.split('Bearer ')[1];
  const decodedToken = await auth.verifyIdToken(idToken);

  if (!decodedToken.admin) {
    throw new Error('Caller is not an admin');
  }
}

export async function toggleVendorPayments(vendorId: string, currentState: boolean) {
  try {
    await verifyAdmin();

    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, {
      paymentsEnabled: !currentState,
    });

    console.log(
      `Toggled paymentsEnabled for vendor ${vendorId} to ${!currentState}`
    );
    
    // Revalidate the path to ensure the UI updates
    revalidatePath('/admin');
    
    return { success: true, newState: !currentState };
  } catch (error: any) {
    console.error('Error toggling vendor payments:', error);
    return { success: false, error: error.message };
  }
}
