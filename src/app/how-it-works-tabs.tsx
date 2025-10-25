
'use client';

import {
  LogIn,
  ShoppingBag,
  MapPin,
  User,
  Store,
  CreditCard,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";


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


export function HowItWorksTabs() {
    return (
        <div key="how-it-works-tabs-wrapper">
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
    )
}
