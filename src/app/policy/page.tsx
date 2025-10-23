
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PolicyPage() {
  return (
    <div>
      <PageHeader
        title="Refund & Dispute Policy"
        description="Our commitment to fair and transparent resolutions for our community."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Platform Refund & Dispute Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p>
              The Suburbmates platform facilitates transactions between local Residents (Buyers) and Vendors. While each Vendor may have their own refund policy (which should be linked on their profile), this document outlines the platform-level rules and procedures that govern all transactions.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                1. Requesting a Refund
              </h3>
              <p>
                Buyers can request a refund directly from their "My Orders" dashboard within 14 days of purchase. To be eligible for a refund, you must provide a valid reason (e.g., item not as described, damaged upon arrival, never received). Providing clear photographic evidence is highly encouraged and may be required to resolve a dispute.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                2. The Vendor Review Process
              </h3>
              <p>
                Once a refund request is submitted, the Vendor is notified and has <strong>72 hours (3 business days)</strong> to respond from their dashboard. The Vendor can either:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Approve the refund:</strong> The refund will be processed automatically via Stripe.</li>
                <li><strong>Reject the request:</strong> The Vendor must provide a clear, written justification for the rejection.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                3. Disputes and Escalation
              </h3>
              <p>
                A dispute is a formal process handled by our payment processor, Stripe, when a buyer and vendor cannot agree on a resolution. A dispute can be initiated by the buyer directly with their bank. When this happens:
              </p>
               <ul className="list-disc pl-6 space-y-1">
                <li>Both the Buyer and Vendor will be notified by email.</li>
                <li>The disputed funds will be held by Stripe until a resolution is reached.</li>
                <li>The Vendor must submit evidence directly through their Stripe Dashboard to challenge the dispute. Failure to do so by the deadline will result in an automatic loss of the dispute.</li>
               </ul>
               <p>
                Filing a dispute is a serious action and should only be used after attempting to resolve the issue directly with the vendor. Stripe's decision is final and binding for all parties.
              </p>
            </div>
            
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                4. Platform Role & Automation
              </h3>
              <p>
                Suburbmates acts as a facilitator and provides the tools for managing these processes. We do not hold funds or issue refunds directly. If a Vendor fails to respond to a refund request within the 72-hour window, the request may be automatically escalated for administrative review. Vendors who consistently fail to respond to requests or fairly engage in the dispute process may have their selling privileges suspended.
              </p>
            </div>
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                5. Acknowledging the Policy
              </h3>
              <p>
                By making a purchase on this platform, you, the Buyer, are acknowledging that you have read and agree to this Refund & Dispute Policy. By registering as a Vendor, you agree to adhere to this policy for all sales conducted through the platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
