'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { collection } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useAuth } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

const replyFormSchema = z.object({
  content: z
    .string()
    .min(1, 'Reply cannot be empty.')
    .max(2000, 'Reply cannot exceed 2000 characters.'),
});

type ForumReplyFormProps = {
  threadId: string;
};

export function ForumReplyForm({ threadId }: ForumReplyFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);


  const form = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      content: '',
    },
  });

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        toast({
            title: "Logged In",
            description: "You can now join the discussion!",
        });
    } catch (error) {
        console.error("Google login error", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not log you in with Google. Please try again.",
        });
    }
  };

  if (!user) {
    return (
       <Card className="text-center p-6">
          <CardTitle>Join the conversation</CardTitle>
          <CardDescription className="mt-2">Sign in with Google to post a reply.</CardDescription>
          <Button className="mt-4" onClick={handleGoogleLogin}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 174 55.9L387 110.1C344.9 73.1 298.8 56 248 56c-94.2 0-170.9 76.7-170.9 170.9s76.7 170.9 170.9 170.9c98.2 0 159.9-67.7 165-148.6H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Sign in with Google
          </Button>
        </Card>
    )
  }


  async function onSubmit(values: z.infer<typeof replyFormSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to post a reply.',
      });
      return;
    }
    setIsSubmitting(true);
    const postsCollectionRef = collection(
      firestore,
      `forumThreads/${threadId}/posts`
    );

    const newPost = {
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous User',
      authorAvatarUrl: user.photoURL || null,
      timestamp: new Date().toISOString(),
      content: values.content,
    };

    try {
        await addDocumentNonBlocking(postsCollectionRef, newPost);

        toast({
        title: 'Reply Posted!',
        description: 'Your reply has been added to the discussion.',
        });

        form.reset();
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Reply Failed",
            description: "Could not save your reply. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
            <AvatarImage src={user.photoURL || undefined} alt={user?.displayName || 'user'} />
            <AvatarFallback>{user?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">Post a Reply</CardTitle>
          <CardDescription>
            Replying as {user.displayName || 'Anonymous User'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Your Reply</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <MessageSquare className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Posting...' : 'Submit Reply'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
