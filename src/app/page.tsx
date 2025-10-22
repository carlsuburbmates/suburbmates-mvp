
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Store,
  Users,
  ShieldCheck,
  Sparkles,
  LogIn,
  ShoppingBag,
  MessageSquare,
  MapPin,
  User,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const heroImage = PlaceHolderImages.find((p) => p.id === "hero-community");
const featureImage1 = PlaceHolderImages.find(
  (p) => p.id === "feature-vendors"
);
const featureImage2 = PlaceHolderImages.find(
  (p) => p.id === "feature-forums"
);

const features = [
  {
    icon: <Store className="h-8 w-8 text-primary" />,
    title: "Verified Vendor Marketplace",
    description:
      "Discover trusted local businesses, from plumbers to bakers, all verified for your peace of mind.",
    link: "/vendors",
    linkText: "Browse Vendors",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Civic Hub Forums",
    description:
      "Join community discussions, share ideas, and stay informed about local events and initiatives.",
    link: "/forums",
    linkText: "Join Discussions",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: "Privacy & Accessibility",
    description:
      "Built on a foundation of trust, with robust privacy controls and adherence to WCAG 2.1 AA standards.",
    link: "/privacy",
    linkText: "Learn More",
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "AI-Powered Summaries",
    description:
      "Quickly get the gist of long discussions and event details with our helpful AI summarization tool.",
    link: "/forums",
    linkText: "See it in Action",
  },
];

const residentSteps = [
  {
    icon: <LogIn className="h-8 w-8 text-primary" />,
    title: "Create Your Account",
    description:
      "Click 'Sign in with Google' on any page to instantly and securely join the community. No new passwords needed.",
  },
  {
    icon: <ShoppingBag className="h-8 w-8 text-primary" />,
    title: "Buy, Review & Discuss",
    description:
      "Once signed in, you can purchase from local vendors, leave reviews, and join discussions in the Civic Hub.",
  },
  {
    icon: <MapPin className="h-8 w-8 text-primary" />,
    title: "Explore Your Suburb",
    description:
      "Browse the full directory of local businesses, find events, and connect with your neighbors.",
  },
];

const businessSteps = [
  {
    icon: <User className="h-8 w-8 text-primary" />,
    title: "Create Your Account",
    description:
      "First, create your free account using Google. This secures your user profile and gives you access to the dashboard.",
  },
  {
    icon: <Store className="h-8 w-8 text-primary" />,
    title: "List Your Business",
    description:
      "From your dashboard, fill out the business registration form. We'll verify your ABN to give you a 'Verified' badge.",
  },
  {
    icon: <CreditCard className="h-8 w-8 text-primary" />,
    title: "Upgrade to a Vendor",
    description:
      "Ready to sell? Connect a Stripe account to become a Marketplace Vendor and start managing orders and payments.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative py-20 md:py-32 bg-card">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 text-center md:text-left items-center md:items-start">
            <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
              Connecting Neighbors, Supporting Locals.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-prose">
              The Darebin Business Directory is your trusted platform for
              discovering local vendors and engaging in community life. Welcome
              to a stronger, more connected neighborhood.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/vendors">
                  Find Local Vendors <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/forums">Explore Community Hub</Link>
              </Button>
            </div>
          </div>
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden shadow-2xl">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              Simple steps to get started, whether you're a resident or a local
              business.
            </p>
          </div>

          <Tabs defaultValue="residents" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="residents">For Residents</TabsTrigger>
              <TabsTrigger value="businesses">For Businesses</TabsTrigger>
            </TabsList>
            <TabsContent value="residents" className="mt-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {residentSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex flex-col items-center text-center gap-4"
                  >
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                      <span className="text-2xl font-bold">{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold font-headline mt-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="businesses" className="mt-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {businessSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="flex flex-col items-center text-center gap-4"
                  >
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                      <span className="text-2xl font-bold">{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold font-headline mt-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">
            Everything Your Suburb Needs
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            We provide the tools to build a vibrant, safe, and supportive local
            community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="flex flex-col bg-background/60 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <CardHeader className="flex flex-col items-center text-center gap-4">
                  {feature.icon}
                  <CardTitle className="font-headline">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col text-center">
                  <p className="text-muted-foreground flex-grow">
                    {feature.description}
                  </p>
                  <Button asChild variant="link" className="mt-4">
                    <Link href={feature.link}>
                      {feature.linkText}{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          {featureImage1 && (
            <div className="relative h-80 md:h-[450px] rounded-xl overflow-hidden shadow-xl order-last md:order-first">
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
            <h3 className="text-3xl md:text-4xl font-bold font-headline">
              A Marketplace You Can Trust
            </h3>
            <p className="text-lg text-muted-foreground">
              Every vendor on the Darebin Business Directory undergoes ABN
              validation and secure onboarding. Find reliable local services
              with transparent reviews and easy discovery through our map-based
              search.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/dashboard/vendor">Become a Vendor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-card">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-4 text-center md:text-left">
            <h3 className="text-3xl md:text-4xl font-bold font-headline">
              The Heart of Your Community
            </h3>
            <p className="text-lg text-muted-foreground">
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
            <div className="relative h-80 md:h-[450px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src={featureImage2.imageUrl}
                alt={featureImage2.description}
                fill
                className="object-cover"
                data-ai-hint={featureImage2.imageHint}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
