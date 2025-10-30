'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useAuth,
  useFirestore,
  useMemoFirebase,
  useUser,
  useCollection,
} from '@/firebase'
import { collection } from 'firebase/firestore'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface ConsentDoc {
  id: string
  userId: string
  agreementId: string
  version: string
  timestamp: string
}

export default function AdminConsentsPage() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const firestore = useFirestore()

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.replace('/login')
      } else {
        user.getIdTokenResult().then((token) => {
          if (!token.claims.admin) router.replace('/')
        })
      }
    }
  }, [user, isUserLoading, router])

  const consentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'consents') : null),
    [firestore]
  )
  const { data: consents, isLoading } = useCollection<ConsentDoc>(consentsQuery)

  if (isUserLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 pb-16">
        <PageHeader
          title="User Consents"
          description="Platform policy consents by user."
        />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="User Consents"
        description="Platform policy consents by user."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Recent Consents</CardTitle>
          </CardHeader>
          <CardContent>
            {consents && consents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Agreement</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        {c.userId}
                      </TableCell>
                      <TableCell>{c.agreementId}</TableCell>
                      <TableCell>{c.version}</TableCell>
                      <TableCell>
                        {new Date(c.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No consent records found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
