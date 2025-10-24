
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, Shield, User, ShoppingCart, LayoutGrid } from 'lucide-react';
import { signOut } from 'firebase/auth';

import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/icons';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


const navItems: NavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Civic Hub', href: '/forums' },
  { title: 'Business Directory', href: '/vendors' },
];

export function Header() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult(true).then(idTokenResult => { // Force refresh of token
        setIsAdmin(!!idTokenResult.claims.admin);
        setIsVendor(!!idTokenResult.claims.vendor);
      });
    } else {
      setIsAdmin(false);
      setIsVendor(false);
    }
  }, [user]);

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-8 flex items-center">
          <Logo className="h-6 w-6 text-primary" />
          <Link href="/" className="ml-2 text-lg font-bold font-headline">
            Suburbmates
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-foreground/80',
                pathname === item.href
                  ? 'text-foreground font-semibold'
                  : 'text-foreground/60'
              )}
            >
              {item.title}
            </Link>
          ))}
           {isAdmin && (
             <Link
              href="/admin"
              className={cn(
                'transition-colors hover:text-foreground/80 flex items-center gap-1',
                pathname?.startsWith('/admin')
                  ? 'text-foreground font-semibold'
                  : 'text-foreground/60'
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          {!isUserLoading &&
            (user ? (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                       <Avatar className="h-8 w-8">
                         {user.photoURL ? (
                            <AvatarImage src={user.photoURL} alt={user.displayName || 'User'}/>
                         ) : (
                           <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                         )}
                       </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                     <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href={isVendor ? "/dashboard/vendor" : "/dashboard/resident"}><LayoutGrid className="mr-2 h-4 w-4" />Dashboard</Link>
                     </DropdownMenuItem>
                     {isAdmin && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                        </DropdownMenuItem>
                     )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

            ) : (
              <div className="hidden md:flex items-center gap-2">
                 <Button asChild variant="ghost">
                    <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                    <Link href="/dashboard/vendor/register">Become a Vendor</Link>
                </Button>
              </div>
            ))}

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
                      <Button asChild>
                        <Link href="/login">Sign in / Sign up</Link>
                      </Button>
                      <Button asChild variant="secondary">
                        <Link href="/dashboard/vendor/register">Become a Vendor</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
