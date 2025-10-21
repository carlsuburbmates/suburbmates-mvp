
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Resident } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { updateProfile } from 'firebase/auth';

const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters.'),
  suburb: z.string().min(2, "Suburb must be at least 2 characters."),
});

export default function EditResidentProfilePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const residentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'residents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: resident, isLoading } = useDoc<Resident>(residentRef);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      suburb: '',
    },
  });

  useEffect(() => {
    if (resident) {
      form.reset({
        displayName: resident.displayName,
        suburb: resident.suburb || '',
      });
    }
  }, [resident, form]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user || !residentRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.',
      });
      return;
    }
    
    // Update Firestore document
    updateDocumentNonBlocking(residentRef, values);

    // Update Firebase Auth profile
    if (user.displayName !== values.displayName) {
        try {
            await updateProfile(user, { displayName: values.displayName });
        } catch (error) {
            console.error("Failed to update auth profile display name:", error);
            // Non-critical error, so we just log it and continue
        }
    }

    toast({
      title: 'Profile Updated!',
      description: 'Your details have been saved.',
    });
    
    router.push('/dashboard/resident');
  }

  if (isLoading) {
    return (
        <>
            <PageHeader
                title="Edit Your Profile"
                description="Update your public display name and suburb."
            />
            <div className="container mx-auto px-4 pb-16 flex justify-center">
                <Card className="w-full max-w-xl">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>
            </div>
        </>
    );
  }

  if (!resident) {
     return (
        <>
            <PageHeader
                title="Profile Not Found"
                description="We couldn't find your resident profile."
            />
             <div className="container mx-auto px-4 pb-16 text-center">
                <Button onClick={() => router.push('/dashboard/resident')}>Return to Dashboard</Button>
            </div>
        </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Your Profile"
        description="Update your public display name and suburb."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Your Details
            </CardTitle>
            <CardDescription>
              This information is displayed on your public posts in the forums.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Jane D."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="suburb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suburb</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Northcote"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => router.push('/dashboard/resident')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
