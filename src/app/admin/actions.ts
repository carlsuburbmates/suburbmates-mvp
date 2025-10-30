'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getAdminServices } from '@/lib/firebase-admin'

async function verifyAdmin(): Promise<{ authUid: string }> {
  const { auth } = await getAdminServices()
  const cookieStore = await cookies()
  const session = cookieStore.get('__session')?.value
  if (!session) {
    throw new Error('Unauthorized')
  }
  const decodedToken = await auth.verifySessionCookie(session, true)
  if (!decodedToken.admin) {
    throw new Error('Caller is not an admin')
  }
  return { authUid: decodedToken.uid }
}

export async function toggleVendorPayments(
  vendorId: string,
  currentState: boolean
) {
  try {
    await verifyAdmin()

    const { db, auth } = getAdminServices()
    const vendorRef = db.collection('vendors').doc(vendorId)
    const newState = !currentState

    // 1. Update the Firestore document
    await vendorRef.update({
      paymentsEnabled: newState,
    })

    // 2. Set custom claims on the user's auth token
    const user = await auth.getUser(vendorId)
    const currentClaims = user.customClaims || {}
    await auth.setCustomUserClaims(vendorId, {
      ...currentClaims,
      vendor: newState,
    })

    console.warn(
      `Toggled paymentsEnabled for vendor ${vendorId} to ${newState} and set custom claim 'vendor: ${newState}'`
    )

    // Revalidate the path to ensure the UI updates
    revalidatePath('/admin')

    return { success: true, newState: newState }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error toggling vendor payments:', err)
    return { success: false, error: err.message }
  }
}
