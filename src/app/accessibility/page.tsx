import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccessibilityPage() {
  return (
    <div>
      <PageHeader
        title="Accessibility Statement"
        description="We are committed to ensuring digital accessibility for people with disabilities."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Our Commitment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p>
              Suburbmates is committed to making its website accessible, in
              accordance with WCAG 2.1 Level AA. We believe in providing a
              positive customer experience to all our customers, and we aim
              to promote accessibility and inclusion.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                1. Conformance Status
              </h3>
              <p>
                The Web Content Accessibility Guidelines (WCAG) defines
                requirements for designers and developers to improve
                accessibility for people with disabilities. It defines three
                levels of conformance: Level A, Level AA, and Level AAA.
                Suburbmates is partially conformant with WCAG 2.1 level AA.
                Partially conformant means that some parts of the content do
                not fully conform to the accessibility standard.
              </p>
               <p>
                Our theme uses high-contrast colors and all interactive elements have a minimum 44x44px hit target. We also use semantic HTML to ensure proper structure.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                2. Feedback
              </h3>
              <p>
                We welcome your feedback on the accessibility of Suburbmates.
                Please let us know if you encounter accessibility barriers:
              </p>
               <ul className="list-disc pl-6">
                <li>E-mail: contact@suburbmates.example.com</li>
                <li>Postal address: 123 Main Street, Northcote VIC 3070</li>
              </ul>
              <p>We try to respond to feedback within 5 business days.</p>
            </div>
            
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                3. Technical specifications
              </h3>
              <p>
                Accessibility of Suburbmates relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer: HTML, WAI-ARIA, CSS, and JavaScript. These technologies are relied upon for conformance with the accessibility standards used.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
