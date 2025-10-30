import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
              By accessing or using Suburbmates, you agree to be bound by these
              Terms of Service and our Privacy Policy. If you do not agree to
              all the terms and conditions, then you may not access the service.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                1. Marketplace and Civic Hub
              </h3>
              <p>
                Our platform provides a Verified Marketplace for local commerce
                and a Civic Hub for community discussions. You agree to use
                these services responsibly and in accordance with all applicable
                local laws.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                2. Vendor Conduct
              </h3>
              <p>
                Vendors must provide accurate information during onboarding,
                including a valid ABN. All transactions are handled by Stripe,
                and we do not store your sensitive financial data.
                Misrepresentation may result in removal from the platform.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">3. User Content</h3>
              <p>
                You are responsible for any content you post in the forums. We
                reserve the right to remove content that is unlawful, offensive,
                or violates any party's intellectual property or these Terms of
                Service.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                4. Prohibited Uses
              </h3>
              <p>
                You may not use the platform for any unlawful purpose, to
                solicit others to perform or participate in any unlawful acts,
                to violate any regulations, rules, laws, or local ordinances, or
                to infringe upon our intellectual property or the intellectual
                property rights of others.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                5. Limitation of Liability
              </h3>
              <p>
                Suburbmates is provided "as is" and we make no warranties
                regarding the reliability, timeliness, or accuracy of the
                service. To the maximum extent permitted by law, we will not be
                liable for any indirect, incidental, or consequential damages
                arising from your use of the platform.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                6. Indemnification
              </h3>
              <p>
                You agree to indemnify, defend, and hold harmless Suburbmates,
                its affiliates, officers, directors, and employees from any
                claim or demand, including reasonable attorneys’ fees, arising
                out of your breach of these Terms or your violation of any law
                or the rights of a third party.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">7. Termination</h3>
              <p>
                We may suspend or terminate your access to the platform at any
                time, without prior notice, for conduct that we believe violates
                these Terms or is harmful to other users or the platform.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                8. Dispute Resolution & Governing Law
              </h3>
              <p>
                These Terms are governed by the laws of Victoria, Australia,
                without regard to its conflict of laws provisions. Any disputes
                shall be resolved in the courts of Victoria. Where permitted by
                law, you agree to first attempt to resolve disputes informally
                by contacting us.
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: October 28, 2025
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
