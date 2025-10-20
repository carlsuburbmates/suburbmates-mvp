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
import { communityEvents, forumThreads } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventSummary } from "./event-summary";

export default function ForumsPage() {
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
              {forumThreads.map((thread) => {
                const authorAvatar = PlaceHolderImages.find(p => p.id === thread.author.avatarId);
                return (
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
                           {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt={thread.author.name} data-ai-hint={authorAvatar.imageHint}/>}
                          <AvatarFallback>{thread.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>
                          {thread.author.name} started this discussion{" "}
                          {thread.timestamp}.
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
                        <span>{thread.posts.length} replies</span>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="events" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityEvents.map((event) => {
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
                        data-ai-hint={eventImage.imageHint}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
              )})}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
