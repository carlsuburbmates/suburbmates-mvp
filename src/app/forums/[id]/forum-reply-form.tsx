
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { collection } from 'firebase/firestore';

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
import { useFirestore, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  const { user } = useUser();

  const form = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      content: '',
    },
  });

  const userAvatar = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');

  if (!user) {
    return (
       <Card className="text-center p-6">
          <CardTitle>Join the conversation</CardTitle>
          <CardDescription className="mt-2">You must be a registered business owner to post a reply.</CardDescription>
          <Button asChild className="mt-4">
            <Link href="/vendors/onboard/register">Register Your Business</Link>
          </Button>
        </Card>
    )
  }


  async function onSubmit(values: z.infer<typeof replyFormSchema>) {
    if (!user || !firestore) {
      // This should not happen if the component renders, but as a safeguard.
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to post a reply.',
      });
      return;
    }

    const postsCollectionRef = collection(
      firestore,
      `forumThreads/${threadId}/posts`
    );

    const newPost = {
      authorId: user.uid,
      authorName: user.displayName || 'Business Owner',
      // This is a placeholder. In a real app, users would have profile avatars.
      authorAvatarId: 'user-avatar-1', 
      timestamp: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      content: values.content,
    };

    addDocumentNonBlocking(postsCollectionRef, newPost);

    toast({
      title: 'Reply Posted!',
      description: 'Your reply has been added to the discussion.',
    });

    form.reset();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={user?.displayName || 'user'} data-ai-hint={userAvatar.imageHint}/>}
            <AvatarFallback>{user?.displayName?.charAt(0) || 'B'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">Post a Reply</CardTitle>
          <CardDescription>
            Replying as {user?.displayName}
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
                <Button type="submit">
                <MessageSquare className="mr-2 h-4 w-4" />
                Submit Reply
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
