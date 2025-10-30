'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useUser } from '@/firebase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

export default function ResidentProfilePage() {
  const { user, isUserLoading } = useUser()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">My Profile</CardTitle>
        <CardDescription>
          This is your resident profile information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUserLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.photoURL || ''}
                alt={user.displayName || 'User'}
              />
              <AvatarFallback>
                {user.displayName?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.displayName}</h3>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ) : (
          <p>You must be logged in to view your profile.</p>
        )}
      </CardContent>
    </Card>
  )
}
