import type { Metadata } from 'next'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Analytics } from '@vercel/analytics/react'
import { FirebaseClientProvider } from '@/firebase/client-provider'
import { CookieBanner } from '@/components/cookie-banner'
import { AuthSessionBridge } from '@/components/AuthSessionBridge'
import { Suspense } from 'react'

// Loading component for improved UX during hydration
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading Suburbmates...</p>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Suburbmates',
  description: 'Your local community hub for vendors and discussions.',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#8FBC8F', // Suburbmates green
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Suburbmates',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('min-h-screen font-body antialiased')}>
        <Suspense fallback={<LoadingFallback />}>
          <FirebaseClientProvider>
            <AuthSessionBridge />
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1" role="main">
                {children}
              </main>
              <Footer />
              <BottomNav />
            </div>
            <Toaster />
            <CookieBanner />
          </FirebaseClientProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
