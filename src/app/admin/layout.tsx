import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAdminServices } from '@/lib/firebase-admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get('__session')?.value

  if (!session) {
    redirect('/login?next=%2Fadmin')
  }

  try {
    const { auth } = await getAdminServices()
    const decoded = await auth.verifySessionCookie(session, true)
    if (!decoded.admin) {
      redirect('/')
    }
  } catch (e) {
    redirect('/login?next=%2Fadmin')
  }

  return <>{children}</>
}
