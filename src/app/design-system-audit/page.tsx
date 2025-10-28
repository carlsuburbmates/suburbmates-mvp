"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DesignSystemAuditPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  return (
    <main className="container mx-auto max-w-3xl p-6 space-y-8 pb-24">
      <Toaster />
      <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold font-headline tracking-tight leading-tight">Design System Audit</h1>

      <section aria-label="Buttons" className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section aria-label="Inputs" className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell us about yourself" />
          </div>
        </div>
      </section>

      <section aria-label="Selection Controls" className="space-y-4">
        <h2 className="text-xl font-semibold">Selection Controls</h2>
        <div className="grid gap-4 md:grid-cols-2 items-start">
          <div className="space-y-2">
            <Label>Choose an option</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one">One</SelectItem>
                <SelectItem value="two">Two</SelectItem>
                <SelectItem value="three">Three</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="switch-demo" />
            <Label htmlFor="switch-demo">Enable setting</Label>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <Checkbox id="checkbox-demo" />
            <Label htmlFor="checkbox-demo">I agree to the terms</Label>
          </div>
          <div className="md:col-span-2">
            <RadioGroup defaultValue="option-a" className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="option-a" id="option-a" />
                <Label htmlFor="option-a">Option A</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="option-b" id="option-b" />
                <Label htmlFor="option-b">Option B</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </section>

      <section aria-label="Tabs and Cards" className="space-y-4">
        <h2 className="text-xl font-semibold">Tabs & Cards</h2>
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Manage your account preferences.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Update your security configurations.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      <section aria-label="Slider and Progress" className="space-y-4">
        <h2 className="text-xl font-semibold">Slider & Progress</h2>
        <Slider defaultValue={[40]} max={100} step={1} className="w-[200px]" />
        <Progress value={33} className="w-[200px]" />
      </section>

      <Separator />

      <section aria-label="Avatar and Badge" className="space-y-4">
        <h2 className="text-xl font-semibold">Avatar & Badge</h2>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="https://avatars.githubusercontent.com/u/9919?s=80" alt="Avatar" />
            <AvatarFallback>AA</AvatarFallback>
          </Avatar>
          <Badge variant="secondary">Badge</Badge>
        </div>
      </section>

      <Separator />

      <section aria-label="Accordion" className="space-y-4">
        <h2 className="text-xl font-semibold">Accordion</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>Yes. It adheres to WAI-ARIA design patterns.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Separator />

      <section aria-label="Alerts" className="space-y-4">
        <h2 className="text-xl font-semibold">Alerts</h2>
        <Alert>
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
        </Alert>
      </section>

      <Separator />

      <section aria-label="Dialog and AlertDialog" className="space-y-4">
        <h2 className="text-xl font-semibold">Dialog & AlertDialog</h2>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>Simple dialog content for audit.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Open AlertDialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <Separator />

      <section aria-label="Menus and Popovers" className="space-y-4">
        <h2 className="text-xl font-semibold">DropdownMenu & Popover</h2>
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">Popover content for audit.</PopoverContent>
          </Popover>
        </div>
      </section>

      <Separator />

      <section aria-label="Tooltip and Sheet" className="space-y-4">
        <h2 className="text-xl font-semibold">Tooltip & Sheet</h2>
        <div className="flex flex-wrap items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Show Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
              </SheetHeader>
              <p className="mt-4 text-sm text-muted-foreground">Side panel content.</p>
            </SheetContent>
          </Sheet>
        </div>
      </section>

      <Separator />

      <section aria-label="Calendar and Carousel" className="space-y-4">
        <h2 className="text-xl font-semibold">Calendar & Carousel</h2>
        <div className="grid gap-4">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          <Carousel className="w-full max-w-xs">
            <CarouselContent>
              {Array.from({ length: 3 }).map((_, idx) => (
                <CarouselItem key={idx} className="flex h-24 items-center justify-center rounded border">
                  Slide {idx + 1}
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-2 flex justify-between">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
        </div>
      </section>

      <Separator />

      <section aria-label="Scroll and Table" className="space-y-4">
        <h2 className="text-xl font-semibold">ScrollArea & Table</h2>
        <ScrollArea className="h-24 w-full rounded border p-2">
          <div className="space-y-2">
            {Array.from({ length: 20 }).map((_, idx) => (
              <p key={idx} className="text-sm">Scrollable line {idx + 1}</p>
            ))}
          </div>
        </ScrollArea>
        <Table>
          <TableCaption>Example table for audit.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>First</TableHead>
              <TableHead>Second</TableHead>
              <TableHead>Third</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Row 1</TableCell>
              <TableCell>Cell</TableCell>
              <TableCell>Cell</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 2</TableCell>
              <TableCell>Cell</TableCell>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <Separator />

      <section aria-label="Skeleton and Toast" className="space-y-4">
        <h2 className="text-xl font-semibold">Skeleton & Toast</h2>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Button
            variant="secondary"
            onClick={() => toast({ title: "Notification", description: "Audit toast example." })}
          >
            Show Toast
          </Button>
        </div>
      </section>

      <section aria-label="Bottom Navigation" className="space-y-2">
        <h2 className="text-xl font-semibold">Bottom Navigation</h2>
        <p className="text-sm text-muted-foreground">Rendered below for mobile viewport checks.</p>
        <div className="border rounded-md p-2">
          <BottomNav />
        </div>
      </section>
    </main>
  );
}