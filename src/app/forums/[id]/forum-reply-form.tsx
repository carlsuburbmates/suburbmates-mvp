
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { collection } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, FacebookAuthProvider } from 'firebase/auth';

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
import { moderateForumPost } from '@/ai/flows/moderate-forum-post';

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
  
  const handleSocialLogin = async (provider: GoogleAuthProvider | FacebookAuthProvider) => {
    try {
        await signInWithPopup(auth, provider);
        toast({
            title: "Logged In",
            description: "You can now join the discussion!",
        });
    } catch (error: any) {
        console.error("Social login error", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.code === 'auth/account-exists-with-different-credential' 
                ? 'An account already exists with this email address. Please sign in with the original method.'
                : 'Could not log you in. Please try again.',
        });
    }
  };

  const handleGoogleLogin = () => handleSocialLogin(new GoogleAuthProvider());
  const handleFacebookLogin = () => handleSocialLogin(new FacebookAuthProvider());

  if (!user) {
    return (
       <Card className="text-center p-6">
          <CardTitle>Join the conversation</CardTitle>
          <CardDescription className="mt-2">Sign in to post a reply.</CardDescription>
          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleGoogleLogin}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 174 55.9L387 110.1C344.9 73.1 298.8 56 248 56c-94.2 0-170.9 76.7-170.9 170.9s76.7 170.9 170.9 170.9c98.2 0 159.9-67.7 165-148.6H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Sign in with Google
            </Button>
            <Button onClick={handleFacebookLogin} style={{ backgroundColor: '#1877F2', color: 'white' }}>
                 <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
                </svg>
                Sign in with Facebook
            </Button>
          </div>
        </Card>
    )
  }


  async function onSubmit(values: z.infer<typeof replyFormSchema>>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to post a reply.',
      });
      return;
    }
    setIsSubmitting(true);
    
    try {
      // Step 1: Moderate content with the AI agent
      const moderationResult = await moderateForumPost({ postContent: values.content });

      if (!moderationResult.isSafe) {
        // If not safe, block the post and show a toast to the user
        toast({
          variant: 'destructive',
          title: 'Post Blocked',
          description: moderationResult.reason || 'Your post was blocked for containing inappropriate content.',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Step 2: If safe, save the post to Firestore
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

      await addDocumentNonBlocking(postsCollectionRef, newPost);

      toast({
        title: 'Reply Posted!',
        description: 'Your reply has been added to the discussion.',
      });

      form.reset();
    } catch(e) {
      console.error("Error during post submission:", e);
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
