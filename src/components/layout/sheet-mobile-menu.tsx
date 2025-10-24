
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, Shield } from 'lucide-react';
import { signOut, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/icons';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { initiateSocialLogin } from '@/firebase/non-blocking-login';
import { useState, useEffect } from 'react';

const navItems: NavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Civic Hub', href: '/forums' },
  { title: 'Business Directory', href: '/vendors' },
];

export function SheetMobileMenu() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

   useEffect(() => {
    if (user) {
      user.getIdTokenResult().then(idTokenResult => {
        setIsAdmin(!!idTokenResult.claims.admin);
      });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleGoogleLogin = () => {
    initiateSocialLogin(auth, new GoogleAuthProvider());
  };
  
  const handleFacebookLogin = () => {
    initiateSocialLogin(auth, new FacebookAuthProvider());
  };

  const handleBecomeVendor = () => {
    if (user) {
      router.push('/dashboard/vendor/register');
      return;
    }
    // If not logged in, start the login process, and then redirect.
    initiateSocialLogin(auth, new GoogleAuthProvider(), () => {
       router.push('/dashboard/vendor/register');
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout Error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'There was a problem logging you out. Please try again.',
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col p-6 h-full">
          <div className="mb-8 flex items-center">
            <Logo className="h-6 w-6 text-primary" />
            <Link
              href="/"
              className="ml-2 text-lg font-bold font-headline"
            >
              Suburbmates
            </Link>
          </div>
          <nav className="flex flex-col gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-lg',
                  pathname === item.href
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground'
                )}
              >
                {item.title}
              </Link>
            ))}
             {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'text-lg flex items-center gap-2',
                  pathname?.startsWith('/admin')
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground'
                )}
              >
                 <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}
          </nav>
           <div className="mt-auto flex flex-col gap-4 pt-8">
            {user ? (
               <Button onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
            ) : (
              <>
                <Button onClick={handleGoogleLogin} variant="secondary">
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 174 55.9L387 110.1C344.9 73.1 298.8 56 248 56c-94.2 0-170.9 76.7-170.9 170.9s76.7 170.9 170.9 170.9c98.2 0 159.9-67.7 165-148.6H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                  Sign in with Google
                </Button>
                 <Button onClick={handleFacebookLogin} style={{ backgroundColor: '#1877F2', color: 'white' }} >
                   <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
                  </svg>
                  Sign in with Facebook
                </Button>
                <Button onClick={handleBecomeVendor}>Become a Vendor</Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
