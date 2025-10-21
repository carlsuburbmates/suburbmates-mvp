import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div>
      <PageHeader
        title="Terms of Service"
        description="Please read these terms carefully before using our service."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p>
              By accessing or using the Darebin Business Directory, you agree to be bound by these
              Terms of Service and our Privacy Policy. If you do not agree to
              all the terms and conditions, then you may not access the
              service.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                1. Marketplace and Civic Hub
              </h3>
              <p>
                Our platform provides a Verified Marketplace for local
                commerce and a Civic Hub for community discussions. You agree
                to use these services responsibly and in accordance with all
                applicable local laws.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">2. Vendor Conduct</h3>
              <p>
                Vendors must provide accurate information during onboarding, including a valid ABN. All transactions are handled by Stripe, and we do not store your sensitive financial data. Misrepresentation may result in removal from the platform.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                3. User Content
              </h3>
              <p>
                You are responsible for any content you post in the forums.
                We reserve the right to remove content that is unlawful,
                offensive, or violates any party's intellectual property or
                these Terms of Service.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                4. Limitation of Liability
              </h3>
              <p>
                The Darebin Business Directory is provided "as is," and we make no warranties
                regarding the reliability, timeliness, or accuracy of the
                service. We are not liable for any disputes between users and
                vendors.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
