
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
        description="Our commitment to fair and transparent resolutions."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Platform Refund Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p>
              The Darebin Business Directory platform facilitates transactions between local Residents (Buyers) and Vendors. While each Vendor may have their own refund policy, this document outlines the general process and platform-level rules for all transactions.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                1. Requesting a Refund
              </h3>
              <p>
                Buyers can request a refund directly from their "My Orders" dashboard within 14 days of purchase. To be eligible for a refund, you must provide a valid reason (e.g., item not received, item significantly not as described, item was damaged). Providing photographic evidence is highly encouraged.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                2. The Vendor Review Process
              </h3>
              <p>
                Once a refund request is submitted, the Vendor is notified and has 72 hours (3 business days) to respond. The Vendor can either approve the refund, in which case it will be processed automatically via Stripe, or reject the request with a clear justification.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                3. Disputes and Escalation
              </h3>
              <p>
                If a Buyer's refund request is rejected by the Vendor, or if the Vendor does not respond within 72 hours, the Buyer can escalate the issue to a formal dispute. This process is managed by Stripe, our payment processor. Stripe will review the evidence submitted by both parties and make a final, binding decision.
              </p>
               <p>
                Filing a dispute is a formal action and should only be used after attempting to resolve the issue with the vendor. The dispute process can take several weeks to resolve.
              </p>
            </div>
            
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                4. Platform Role
              </h3>
              <p>
                The Darebin Business Directory acts as a facilitator. We do not hold funds and are not responsible for issuing refunds directly. Our role is to provide the tools for Buyers and Vendors to communicate and to ensure the process is followed. We reserve the right to suspend vendors who consistently fail to adhere to this policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
