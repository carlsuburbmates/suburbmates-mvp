import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader
        title="Privacy Statement"
        description="Your trust and privacy are paramount to us."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Our Commitment to Your Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p>
              Welcome to Suburbmates. We are committed to protecting your
              personal information and your right to privacy. If you have any
              questions or concerns about this privacy notice, or our practices
              with regards to your personal information, please contact us.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                1. What Information We Collect
              </h3>
              <p>
                We collect personal information that you voluntarily provide to
                us when you register on the Suburbmates, express an interest in
                obtaining information about us or our products and services,
                when you participate in activities on the Suburbmates (such as
                posting messages in our online forums or entering competitions,
                contests or giveaways) or otherwise when you contact us.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                2. How We Use Your Information
              </h3>
              <p>
                We use personal information collected via our Suburbmates for a
                variety of business purposes described below. We process your
                personal information for these purposes in reliance on our
                legitimate business interests, in order to enter into or perform
                a contract with you, with your consent, and/or for compliance
                with our legal obligations.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                3. Will Your Information Be Shared With Anyone?
              </h3>
              <p>
                We only share information with your consent, to comply with
                laws, to provide you with services, to protect your rights, or
                to fulfill business obligations. For vendor onboarding, we
                facilitate a secure handoff to Stripe for payment processing, but
                we do not store your sensitive financial data on our servers.
              </p>
            </div>
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                4. Data Security
              </h3>
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. This includes segregation of sensitive data and maintaining audit logs to track access and changes to your information. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
