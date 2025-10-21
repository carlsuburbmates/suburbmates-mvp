
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, ExternalLink } from 'lucide-react';

export default function VendorPaymentsPage() {
    
  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Manage Payments</CardTitle>
            <CardDescription>
                Review your payment status and manage your Stripe account.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center p-4 rounded-lg bg-secondary/50 border border-secondary">
                <CheckCircle className="h-6 w-6 text-green-600 mr-4" />
                <div>
                    <h3 className="font-semibold">Stripe Account Connected</h3>
                    <p className="text-sm text-muted-foreground">
                        Your account is ready to receive payments from marketplace sales.
                    </p>
                </div>
            </div>
            
            <div className='space-y-2'>
                <h4 className='font-semibold'>Payouts</h4>
                <p className='text-sm text-muted-foreground'>
                    Payouts are managed by Stripe and are typically transferred to your bank account on a rolling 7-day basis. For detailed reports, transaction history, and to manage your bank details, please visit your Stripe dashboard.
                </p>
                 <Button asChild variant="outline">
                    <a href="https://dashboard.stripe.com/test" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4"/>
                        Go to Stripe Dashboard
                    </a>
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
