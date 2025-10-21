
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Gem } from 'lucide-react';

const basicFeatures = [
  '1 Active Listing',
  'Basic Profile Page',
  'Accept Online Payments',
  'Appear in Directory',
];
const premiumFeatures = [
  'Unlimited Listings',
  'Enhanced Profile Page (Coming Soon)',
  'Priority Placement in Search (Coming Soon)',
  'Access to Analytics (Coming Soon)',
];

export default function VendorUpgradePage() {
  const handleUpgrade = () => {
    // This would typically redirect to a Stripe Checkout session for a subscription.
    // For now, it's just a placeholder.
    alert('Stripe Checkout for subscriptions is not implemented yet.');
  };
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-headline">Basic Tier</CardTitle>
          <CardDescription>
            The essentials to get you started on the directory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-4xl font-bold">Free</div>
          <ul className="space-y-2">
            {basicFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button disabled variant="outline" className="w-full">
            Currently Active
          </Button>
        </CardFooter>
      </Card>
      <Card className="border-2 border-primary shadow-lg shadow-primary/20 relative">
         <div className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
           Most Popular
         </div>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" />
            Premium Tier
          </CardTitle>
          <CardDescription>
            Unlock the full potential of your business on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-4xl font-bold">$29<span className='text-base font-normal text-muted-foreground'>/month</span></div>
          <ul className="space-y-2">
            {premiumFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpgrade} className="w-full">
            Upgrade to Premium
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
