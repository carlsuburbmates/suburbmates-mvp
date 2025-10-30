import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function CookiesPage() {
  const lastUpdated = 'October 28, 2025'
  return (
    <div>
      <PageHeader
        title="Cookie Policy"
        description="How we use cookies and similar technologies on Suburbmates."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <p>
              This Cookie Policy explains how Suburbmates uses cookies and
              similar technologies to recognize you when you visit our website.
              It explains what these technologies are and why we use them, as
              well as your rights to control our use of them.
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                1. What are cookies?
              </h3>
              <p>
                Cookies are small data files that are placed on your computer or
                mobile device when you visit a website. Cookies are widely used
                by website owners in order to make their websites work, or to
                work more efficiently, as well as to provide reporting
                information.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                2. Why do we use cookies?
              </h3>
              <p>
                We use first and third‑party cookies for several reasons. Some
                cookies are required for technical reasons in order for our
                website to operate ("essential" or "strictly necessary"
                cookies). Other cookies enable us to enhance the performance and
                functionality of our website (e.g. analytics).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                3. Types of cookies we use
              </h3>
              <ul className="list-disc pl-6">
                <li>
                  <strong>Essential cookies</strong>: required for core features
                  such as authentication and security.
                </li>
                <li>
                  <strong>Analytics cookies</strong>: help us understand site
                  usage to improve the experience.
                </li>
                <li>
                  <strong>Preference cookies</strong>: remember settings like
                  theme or location.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                4. How can you control cookies?
              </h3>
              <p>
                You have the right to decide whether to accept or reject
                cookies. Most browsers allow you to remove or reject cookies via
                their settings. If you disable cookies, parts of the site may
                not function properly.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">5. Updates</h3>
              <p>
                We may update this Cookie Policy from time to time to reflect
                changes to the cookies we use or for other operational, legal or
                regulatory reasons. Please revisit this policy regularly to stay
                informed.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                6. More information
              </h3>
              <p>
                For further details about how we process your personal data,
                please read our{' '}
                <Link href="/privacy" className="underline text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
