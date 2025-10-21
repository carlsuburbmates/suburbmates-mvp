
'use client';

import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageSquare, ArrowLeft, Building2 } from "lucide-react";
import { collection, doc } from "firebase/firestore";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscussionSummary } from "./discussion-summary";
import { Separator } from "@/components/ui/separator";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { ForumThread, ForumPost } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ForumThreadPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const threadRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "forumThreads", params.id) : null),
    [firestore, params.id]
  );
  const { data: thread, isLoading: isThreadLoading } = useDoc<ForumThread>(threadRef);

  const postsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "forumThreads", params.id, "posts") : null),
    [firestore, params.id]
  );
  const { data: posts, isLoading: arePostsLoading } = useCollection<ForumPost>(postsQuery);

  if (isThreadLoading) {
    return (
       <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          <Skeleton className="h-10 w-48 mb-8" />
          <header className="mb-8 space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
          </header>
          <Skeleton className="h-24 w-full mb-8" />
           <div className="space-y-6">
              <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
              <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
           </div>
       </div>
    );
  }

  if (!thread) {
    notFound();
  }

  const fullDiscussionText = posts
    ?.map((p) => `${p.authorName}: ${p.content}`)
    .join("\n\n");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <Button asChild variant="ghost" className="-ml-4">
          <Link href="/forums">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all discussions
          </Link>
        </Button>
      </div>

      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          {thread.tags.map((tag) => (
            <Badge key={tag.name} variant={tag.variant}>
              {tag.isCouncil && <Building2 className="w-3 h-3 mr-1.5" />}
              {tag.name}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">
          {thread.title}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-5 w-5" />
          <span>
            {arePostsLoading ? '...' : (posts?.length || 0)} posts in this discussion
          </span>
        </div>
      </header>

      <div className="mb-8">
        <DiscussionSummary discussionText={fullDiscussionText || ""} />
      </div>

      <div className="space-y-6">
        {arePostsLoading && Array.from({length:2}).map((_, i) => (
           <Card key={i}><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
        ))}
        {posts?.map((post, index) => {
          const authorAvatar = PlaceHolderImages.find(
            (p) => p.id === post.authorAvatarId
          );
          const isFirstPost = index === 0;

          return (
            <Card
              key={post.id}
              className={isFirstPost ? "border-primary border-2" : ""}
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Avatar className="h-10 w-10">
                  {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt={post.authorName} data-ai-hint={authorAvatar.imageHint}/>}
                  <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{post.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.timestamp}
                  </p>
                </div>
                {isFirstPost && <Badge variant="outline">Original Post</Badge>}
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
       <Separator className="my-8" />
       <div className="text-center">
        <Button disabled>Post a Reply</Button>
        <p className="text-sm text-muted-foreground mt-2">Replying is coming soon.</p>
       </div>
    </div>
  );
}
