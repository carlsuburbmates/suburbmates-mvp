import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function LegalIndexPage() {
  return (
    <div>
      <PageHeader
        title="Legal & Policies"
        description="Find our policies and legal documents in one place."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <Link href="/privacy" className="underline text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="underline text-foreground">
              Terms of Service
            </Link>
            <Link href="/policy" className="underline text-foreground">
              Refund & Dispute Policy
            </Link>
            <Link href="/cookies" className="underline text-foreground">
              Cookie Policy
            </Link>
            <Link href="/accessibility" className="underline text-foreground">
              Accessibility Statement
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
