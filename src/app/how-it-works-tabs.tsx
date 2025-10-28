
'use client';

import React, { useEffect, useRef, useState } from "react";
import {
  LogIn,
  ShoppingBag,
  MapPin,
  User,
  Store,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";


const residentSteps = [
  {
    icon: <LogIn className="h-5 w-5" />,
    title: "Create Your Account",
    description:
      "Click 'Sign in with Google' on any page to instantly and securely join the community. No new passwords needed.",
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    title: "Buy, Review & Discuss",
    description:
      "Once signed in, you can purchase from local vendors, leave reviews, and join discussions in the Civic Hub.",
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    title: "Explore Your Suburb",
    description:
      "Browse the full directory of local businesses, find events, and connect with your neighbors.",
  },
];

const businessSteps = [
  {
    icon: <User className="h-5 w-5" />,
    title: "Create Your Account",
    description:
      "First, create your free account using Google. This secures your user profile and gives you access to the dashboard.",
  },
  {
    icon: <Store className="h-5 w-5" />,
    title: "List Your Business",
    description:
      "From your dashboard, fill out the business registration form. We'll verify your ABN to give you a 'Verified' badge.",
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: "Upgrade to a Vendor",
    description:
      "Ready to sell? Connect a Stripe account to become a Marketplace Vendor and start managing orders and payments.",
  },
];


const DEFAULT_THEMES = {
  residents: {
    frameBg: "bg-primary/10",
    frameText: "text-primary",
    frameRing: "ring-1 ring-primary/20",
  },
  businesses: {
    frameBg: "bg-secondary/10",
    frameText: "text-secondary",
    frameRing: "ring-1 ring-secondary/20",
  },
} as const;

type HowItWorksThemes = Partial<typeof DEFAULT_THEMES>;

export function HowItWorksTabs({ themes }: { themes?: HowItWorksThemes }) {
    const mergedThemes = {
      residents: { ...DEFAULT_THEMES.residents, ...(themes?.residents || {}) },
      businesses: { ...DEFAULT_THEMES.businesses, ...(themes?.businesses || {}) },
    };

    // Scroll indicator (chevrons) state for each scroller
    const resRef = useRef<HTMLDivElement | null>(null);
    const bizRef = useRef<HTMLDivElement | null>(null);
    const [resAtStart, setResAtStart] = useState(true);
    const [resAtEnd, setResAtEnd] = useState(false);
    const [bizAtStart, setBizAtStart] = useState(true);
    const [bizAtEnd, setBizAtEnd] = useState(false);

    useEffect(() => {
      const attach = (el: HTMLDivElement | null, setStart: (v: boolean) => void, setEnd: (v: boolean) => void) => {
        if (!el) return;
        const update = () => {
          const { scrollLeft, scrollWidth, clientWidth } = el;
          setStart(scrollLeft <= 1);
          setEnd(scrollLeft + clientWidth >= scrollWidth - 1);
        };
        update();
        el.addEventListener("scroll", update, { passive: true });
        const obs = new ResizeObserver(update);
        obs.observe(el);
        return () => {
          el.removeEventListener("scroll", update);
          obs.disconnect();
        };
      };

      const cleanupRes = attach(resRef.current, setResAtStart, setResAtEnd);
      const cleanupBiz = attach(bizRef.current, setBizAtStart, setBizAtEnd);
      return () => {
        cleanupRes && cleanupRes();
        cleanupBiz && cleanupBiz();
      };
    }, []);
    return (
        <div key="how-it-works-tabs-wrapper">
          <Tabs defaultValue="residents" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="residents">For Residents</TabsTrigger>
                <TabsTrigger value="businesses">For Businesses</TabsTrigger>
              </TabsList>
              <TabsContent value="residents" className="mt-10">
                <div className="relative -mx-4 md:mx-0">
                  <div ref={resRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6 md:overflow-visible px-4">
                    {residentSteps.map((step, index) => (
                      <div
                        key={step.title}
                        className="snap-start min-w-[260px] max-w-[320px] md:min-w-0 group rounded-lg border bg-card/70 backdrop-blur-sm p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex items-center justify-center h-10 w-10 rounded-md ${mergedThemes.residents.frameBg} ${mergedThemes.residents.frameText} ${mergedThemes.residents.frameRing}`}>
                            {step.icon}
                          </div>
                          <span className="text-[10px] text-muted-foreground">Step {index + 1}</span>
                        </div>
                        <h3 className="font-headline font-semibold text-sm md:text-base leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground text-xs md:text-sm mt-1">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Gradient masks to hint horizontal scroll on mobile */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-8 md:hidden bg-gradient-to-r from-background to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-8 md:hidden bg-gradient-to-l from-background to-transparent" />
                  {/* Subtle chevron scroll indicators (fade out when edges reached) */}
                  <div className={`pointer-events-none absolute inset-y-0 left-1 flex items-center md:hidden transition-opacity duration-300 ${resAtStart ? 'opacity-0' : 'opacity-60'}`}>
                    <div className="rounded-full bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 ring-1 ring-border shadow-sm p-1">
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </div>
                  <div className={`pointer-events-none absolute inset-y-0 right-1 flex items-center md:hidden transition-opacity duration-300 ${resAtEnd ? 'opacity-0' : 'opacity-60'}`}>
                    <div className="rounded-full bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 ring-1 ring-border shadow-sm p-1">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="businesses" className="mt-10">
                <div className="relative -mx-4 md:mx-0">
                  <div ref={bizRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-6 md:overflow-visible px-4">
                    {businessSteps.map((step, index) => (
                      <div
                        key={step.title}
                        className="snap-start min-w-[260px] max-w-[320px] md:min-w-0 group rounded-lg border bg-card/70 backdrop-blur-sm p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`flex items-center justify-center h-10 w-10 rounded-md ${mergedThemes.businesses.frameBg} ${mergedThemes.businesses.frameText} ${mergedThemes.businesses.frameRing}`}>
                            {step.icon}
                          </div>
                          <span className="text-[10px] text-muted-foreground">Step {index + 1}</span>
                        </div>
                        <h3 className="font-headline font-semibold text-sm md:text-base leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground text-xs md:text-sm mt-1">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Gradient masks to hint horizontal scroll on mobile */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-8 md:hidden bg-gradient-to-r from-background to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-8 md:hidden bg-gradient-to-l from-background to-transparent" />
                  {/* Subtle chevron scroll indicators (fade out when edges reached) */}
                  <div className={`pointer-events-none absolute inset-y-0 left-1 flex items-center md:hidden transition-opacity duration-300 ${bizAtStart ? 'opacity-0' : 'opacity-60'}`}>
                    <div className="rounded-full bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 ring-1 ring-border shadow-sm p-1">
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </div>
                  <div className={`pointer-events-none absolute inset-y-0 right-1 flex items-center md:hidden transition-opacity duration-300 ${bizAtEnd ? 'opacity-0' : 'opacity-60'}`}>
                    <div className="rounded-full bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 ring-1 ring-border shadow-sm p-1">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
        </div>
    )
}
