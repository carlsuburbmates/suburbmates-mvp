
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Store,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
// removed framer-motion to keep this server component SSR-friendly; using CSS transitions for subtle motion
import { HowItWorksTabs } from "./how-it-works-tabs";

const heroImage = PlaceHolderImages.find((p) => p.id === "hero-community");
const featureImage1 = PlaceHolderImages.find(
  (p) => p.id === "feature-vendors"
);
const featureImage2 = PlaceHolderImages.find(
  (p) => p.id === "feature-forums"
);

const features = [
  {
    icon: <Store className="h-5 w-5" />,
    title: "Verified Vendor Marketplace",
    description:
      "Discover trusted local businesses, from plumbers to bakers, all verified for your peace of mind.",
    link: "/vendors",
    linkText: "Browse Vendors",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Civic Hub Forums",
    description:
      "Join community discussions, share ideas, and stay informed about local events and initiatives.",
    link: "/forums",
    linkText: "Join Discussions",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Privacy & Accessibility",
    description:
      "Built on a foundation of trust, with robust privacy controls and adherence to WCAG 2.1 AA standards.",
    link: "/privacy",
    linkText: "Learn More",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "AI-Powered Summaries",
    description:
      "Quickly get the gist of long discussions and event details with our helpful AI summarization tool.",
    link: "/forums",
    linkText: "See it in Action",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-6 text-center md:text-left items-center md:items-start">
            <h1 className="text-[clamp(1.5rem,5vw,3rem)] font-bold font-headline tracking-tight leading-tight">
              Connecting Neighbors, Supporting Locals.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-prose">
              Suburbmates is your trusted platform for
              discovering local vendors and engaging in community life. Welcome
              to a stronger, more connected neighborhood.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/vendors">
                  Find Local Vendors <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/forums">Explore Community Hub</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden shadow-md">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-[clamp(1.375rem,3vw,2.25rem)] font-bold font-headline leading-tight">
              How It Works
            </h2>
            <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              Simple steps to get started, whether you&apos;re a resident or a local
              business.
            </p>
          </div>
            <HowItWorksTabs />
        </div>
      </section>

      <section className="py-16 md:py-20 bg-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-[clamp(1.375rem,3vw,2.25rem)] font-bold font-headline leading-tight">
            Everything Your Suburb Needs
          </h2>
          <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
            We provide the tools to build a vibrant, safe, and supportive local
            community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {features.map((feature) => (
              <div key={feature.title} className="transition-transform will-change-transform hover:-translate-y-0.5">
                <Card className="flex flex-col bg-card/70 backdrop-blur-sm border hover:bg-card/80 transition-colors">
                  <CardHeader className="flex flex-col items-center text-center gap-2 p-4">
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary ring-1 ring-primary/20 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline text-base tracking-tight">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col text-center p-4">
                    <p className="text-muted-foreground flex-grow text-sm">
                      {feature.description}
                    </p>
                    <Button asChild variant="link" className="mt-3">
                      <Link href={feature.link}>
                        {feature.linkText}{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          {featureImage1 && (
            <div className="relative h-80 md:h-[420px] rounded-xl overflow-hidden shadow-md order-last md:order-first">
              <Image
                src={featureImage1.imageUrl}
                alt={featureImage1.description}
                fill
                className="object-cover"
                data-ai-hint={featureImage1.imageHint}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
          <div className="flex flex-col gap-4 text-center md:text-left">
            <h3 className="text-[clamp(1.25rem,2.5vw,2rem)] font-bold font-headline leading-tight">
              A Marketplace You Can Trust
            </h3>
            <p className="text-base md:text-lg text-muted-foreground">
              Every vendor on Suburbmates undergoes ABN
              validation and secure onboarding. Find reliable local services
              with transparent reviews and easy discovery through our map-based
              search.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/dashboard/vendor/register">Become a Vendor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-card">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4 text-center md:text-left">
            <h3 className="text-[clamp(1.25rem,2.5vw,2rem)] font-bold font-headline leading-tight">
              The Heart of Your Community
            </h3>
            <p className="text-base md:text-lg text-muted-foreground">
              From council announcements to neighborhood watch updates and local
              workshops, our Civic Hub keeps you in the loop. Participate in
              discussions that matter to you.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/forums">Join the Conversation</Link>
              </Button>
            </div>
          </div>
          {featureImage2 && (
            <div className="relative h-80 md:h-[420px] rounded-xl overflow-hidden shadow-md">
              <Image
                src={featureImage2.imageUrl}
                alt={featureImage2.description}
                fill
                className="object-cover"
                data-ai-hint={featureImage2.imageHint}
                sizes="(maxwidth: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
