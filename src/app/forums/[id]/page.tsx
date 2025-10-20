import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageSquare, ArrowLeft, Building2 } from "lucide-react";

import { forumThreads } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscussionSummary } from "./discussion-summary";
import { Separator } from "@/components/ui/separator";

export default function ForumThreadPage({ params }: { params: { id: string } }) {
  const thread = forumThreads.find((t) => t.id === params.id);

  if (!thread) {
    notFound();
  }

  const fullDiscussionText = thread.posts
    .map((p) => `${p.author.name}: ${p.content}`)
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
            {thread.posts.length} posts in this discussion
          </span>
        </div>
      </header>

      <div className="mb-8">
        <DiscussionSummary discussionText={fullDiscussionText} />
      </div>

      <div className="space-y-6">
        {thread.posts.map((post, index) => {
          const authorAvatar = PlaceHolderImages.find(
            (p) => p.id === post.author.avatarId
          );
          const isFirstPost = index === 0;

          return (
            <Card
              key={post.id}
              className={isFirstPost ? "border-primary border-2" : ""}
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Avatar className="h-10 w-10">
                  {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt={post.author.name} data-ai-hint={authorAvatar.imageHint}/>}
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{post.author.name}</p>
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
