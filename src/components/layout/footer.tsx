import Link from 'next/link'
import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Newspaper } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-card">
      {/* Editorial prefooter */}
      <section className="bg-foreground text-background border-t border-border/60 pt-12 mt-16">
        <div className="container mx-auto px-4 py-12">
          <Link
            href="/editorial"
            aria-label="Visit the Editorial hub"
            className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-tight text-background/70 hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/40 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground rounded"
          >
            <Newspaper className="h-4 w-4" aria-hidden="true" />
            <span>Editorial</span>
          </Link>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-background/10 p-8 shadow-sm">
              <h3 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold font-headline leading-tight">
                Submit your website for visibility and recognition
              </h3>
              <p className="mt-2 text-background/80">
                Share your work with the community and gain exposure across our
                platform.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-4 border-background/40 text-background hover:bg-background/10"
              >
                <Link href="/submit">Submit your site</Link>
              </Button>
            </div>
            <div className="rounded-lg border border-background/10 p-8 shadow-sm">
              <h3 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold font-headline leading-tight">
                Get access to special pro features
              </h3>
              <p className="mt-2 text-background/80">
                Unlock advanced tools and priority placement designed for
                professionals.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-4 border-background/40 text-background hover:bg-background/10"
              >
                <Link href="/pro">Explore Pro</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Legal footer */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <p className="text-sm font-semibold">
              Suburbmates &copy; {currentYear}
            </p>
          </div>
          <nav className="flex gap-4 text-sm text-muted-foreground flex-wrap justify-center">
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/policy"
              className="hover:text-primary transition-colors"
            >
              Refund Policy
            </Link>
            <Link
              href="/cookies"
              className="hover:text-primary transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/accessibility"
              className="hover:text-primary transition-colors"
            >
              Accessibility
            </Link>
            <Link
              href="/legal"
              className="hover:text-primary transition-colors"
            >
              Legal
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
