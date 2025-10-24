'use client';

import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare,
  Users,
  CalendarDays,
  MapPin,
  Building2,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EventSummary } from "./event-summary";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { CommunityEvent, ForumThread } from "@/lib/types";
import { collection } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function ForumsPage() {
  const firestore = useFirestore();

  const threadsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "forumThreads") : null),
    [firestore]
  );
  const { data: forumThreads, isLoading: areThreadsLoading } =
    useCollection<ForumThread>(threadsQuery);

  const eventsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "communityEvents") : null),
    [firestore]
  );
  const { data: communityEvents, isLoading: areEventsLoading } =
    useCollection<CommunityEvent>(eventsQuery);
  
  const userAvatar1 = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');

  return (
    <div>
      <PageHeader
        title="Civic Hub"
        description="Engage in discussions, stay updated on local events, and connect with your neighbors."
      />
      <div className="container mx-auto px-4 pb-16">
        <Tabs defaultValue="discussions">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="discussions">
              <MessageSquare className="w-4 h-4 mr-2" /> Discussions
            </TabsTrigger>
            <TabsTrigger value="events">
              <CalendarDays className="w-4 h-4 mr-2" /> Local Events
            </TabsTrigger>
          </TabsList>
          <TabsContent value="discussions" className="mt-6">
            <div className="grid gap-6">
              {areThreadsLoading && Array.from({length: 2}).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardFooter>
                     <Skeleton className="h-6 w-1/4" />
                  </CardFooter>
                </Card>
              ))}
              {forumThreads?.map((thread) => (
                  <Card key={thread.id}>
                    <CardHeader>
                      <CardTitle className="font-headline text-xl">
                        <Link
                          href={`/forums/${thread.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {thread.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-sm pt-2">
                        <Avatar className="h-6 w-6">
                           <AvatarImage src={thread.authorAvatarUrl} alt={thread.authorName} />
                          <AvatarFallback>{thread.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>
                          {thread.authorName} started this discussion on{" "}
                          {new Date(thread.timestamp).toLocaleDateString()}.
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between items-center">
                      <div className="flex gap-2 flex-wrap">
                        {thread.tags.map((tag) => (
                          <Badge key={tag.name} variant={tag.variant}>
                            {tag.isCouncil && (
                              <Building2 className="w-3 h-3 mr-1.5" />
                            )}
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Users className="w-4 h-4" />
                        <span>{thread.postCount || 0} replies</span>
                      </div>
                    </CardFooter>
                  </Card>
                )
              )}
              {!areThreadsLoading && forumThreads?.length === 0 && (
                <Card className="text-center p-8">
                  <CardTitle>No Discussions Yet</CardTitle>
                  <CardDescription>
                    Be the first to start a conversation in the community.
                  </CardDescription>
                </Card>
              )}
            </div>
          </TabsContent>
          <TabsContent value="events" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areEventsLoading && Array.from({length: 3}).map((_, i) =>(
                <Card key={i}>
                  <Skeleton className="h-56 w-full rounded-t-lg" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                  </CardContent>
                </Card>
              ))}
              {communityEvents?.map((event) => {
                const eventImage = PlaceHolderImages.find(p => p.id === event.imageId);
                return (
                  <Card key={event.id} className="flex flex-col">
                    {eventImage && (
                      <div className="relative h-56 w-full">
                         <Image
                          src={eventImage.imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover rounded-t-lg"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          data-ai-hint={eventImage.imageHint}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="font-headline">{event.title}</CardTitle>
                      <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="w-4 h-4"/>
                          <span>{event.date}</span>
                      </div>
                       <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4"/>
                          <span>{event.location}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <EventSummary eventDetails={event.details} />
                    </CardFooter>
                  </Card>
                )
              })}
               {!areEventsLoading && communityEvents?.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3 text-center p-8">
                  <CardTitle>No Upcoming Events</CardTitle>
                  <CardDescription>
                    Check back soon for local events and workshops.
                  </CardDescription>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
