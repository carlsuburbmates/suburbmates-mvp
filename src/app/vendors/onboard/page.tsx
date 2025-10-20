"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CreditCard, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters."),
  abn: z.string().regex(/^\d{2} \d{3} \d{3} \d{3}$/, "Please enter a valid ABN format (e.g., 12 345 678 901)."),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions to continue.",
  }),
});

export default function OnboardPage() {
    const [step, setStep] = useState(1);
    const { toast } = useToast();
    const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      abn: "",
      consent: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Details Validated",
      description: "Your business details have been successfully validated.",
    });
    setStep(2);
  }

  function handleStripeConnect() {
     toast({
      title: "Redirecting to Stripe...",
      description: "You are being securely redirected to Stripe to connect your account. This is a simulation.",
    });
    // In a real app, you would redirect to Stripe. Here we'll just move to the next step.
    router.push("/vendors/onboard/listing");
  }

  return (
    <>
      <PageHeader
        title="Become a Trusted Vendor"
        description="Join our marketplace to connect with local customers."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Vendor Onboarding
            </CardTitle>
            <CardDescription>
              Complete the steps below to get your business listed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex items-center text-sm text-muted-foreground mb-6">
                    <CheckCircle2 className="w-5 h-5 mr-2 text-primary" />
                    <span>Step 1: Business Details</span>
                    <div className="flex-grow border-t border-dashed mx-4"></div>
                    <CheckCircle2 className="w-5 h-5 mr-2 text-muted" />
                    <span>Step 2: Connect Payments</span>
                </div>

                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Green Thumb Gardening" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="abn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Australian Business Number (ABN)</FormLabel>
                        <FormControl>
                          <Input placeholder="12 345 678 901" {...field} />
                        </FormControl>
                        <FormDescription>
                          We validate your ABN to ensure all vendors are
                          legitimate businesses.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Agree to Terms and Conditions</FormLabel>
                          <FormDescription>
                            By checking this box, you agree to our{" "}
                            <Link href="/terms" className="underline hover:text-primary">
                              Terms of Service
                            </Link>{" "}
                            and acknowledge our{" "}
                            <Link href="/privacy" className="underline hover:text-primary">
                              Privacy Policy
                            </Link>
                            , including purpose-specific data usage for vendor verification.
                          </FormDescription>
                           <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full md:w-auto">
                    Validate and Continue
                  </Button>
                </form>
              </Form>
            )}

            {step === 2 && (
                <div className="space-y-8">
                     <div className="flex items-center text-sm text-muted-foreground mb-6">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-primary" />
                        <span className="font-semibold text-foreground">Step 1: Business Details</span>
                        <div className="flex-grow border-t border-solid mx-4 border-primary"></div>
                        <CheckCircle2 className="w-5 h-5 mr-2 text-primary" />
                        <span>Step 2: Connect Payments</span>
                    </div>

                    <div className="text-center bg-secondary p-8 rounded-lg">
                        <h3 className="font-headline text-xl font-bold">Connect your Stripe account</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            We partner with Stripe for secure payment processing. You will be redirected to Stripe to connect your account securely. We do not handle your financial information directly.
                        </p>
                        <Button className="mt-6" size="lg" onClick={handleStripeConnect}>
                            <CreditCard className="mr-2 h-5 w-5"/>
                            Connect with Stripe & Create Listing
                        </Button>
                    </div>
                     <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
