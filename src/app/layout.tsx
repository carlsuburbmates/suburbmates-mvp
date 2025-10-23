
import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "Darebin Business Directory",
  description: "Your local community hub for vendors and discussions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lexend:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn("min-h-screen font-body antialiased")}>
        <FirebaseClientProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </FirebaseClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
