import Link from "next/link";
import { Logo } from "@/components/icons";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <p className="text-sm font-semibold">
              Suburbmates &copy; {currentYear}
            </p>
          </div>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
