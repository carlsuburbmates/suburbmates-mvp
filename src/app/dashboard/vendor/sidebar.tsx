
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, ShoppingCart, LayoutGrid, User, FileQuestion, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const vendorNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard/vendor',
    icon: <LayoutGrid className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Orders',
    href: '/dashboard/vendor/orders',
    icon: <ShoppingCart className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Refunds',
    href: '/dashboard/vendor/refunds',
    icon: <FileQuestion className="mr-2 h-4 w-4" />,
  },
   {
    title: 'Disputes',
    href: '/dashboard/vendor/disputes',
    icon: <ShieldAlert className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Payments',
    href: '/dashboard/vendor/payments',
    icon: <CreditCard className="mr-2 h-4 w-4" />,
  },
];

const businessOwnerNavItems = [
    {
        title: 'Business Dashboard',
        href: '/dashboard/vendor',
        icon: <LayoutGrid className="mr-2 h-4 w-4" />,
    }
]

const residentNavItems = [
    {
        title: 'My Orders',
        href: '/dashboard/resident',
        icon: <ShoppingCart className="mr-2 h-4 w-4" />,
    },
     {
        title: 'My Profile',
        href: '/dashboard/resident/profile',
        icon: <User className="mr-2 h-4 w-4" />,
    }
]

export function DashboardSidebar({ isVendor, hasActiveListings }: { isVendor: boolean, hasActiveListings: boolean }) {
  const pathname = usePathname();
  
  let primaryNavItems;
  if (isVendor) {
      primaryNavItems = hasActiveListings ? vendorNavItems : businessOwnerNavItems;
  } else {
      primaryNavItems = residentNavItems;
  }

  const secondaryNavItems = isVendor ? residentNavItems : [];

  return (
    <Card className="sticky top-[140px]">
      <CardContent className="p-2">
        <nav className="flex flex-col gap-1">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: pathname === item.href ? 'default' : 'ghost',
                  size: 'default',
                }),
                'justify-start',
                pathname === item.href && item.title === 'Disputes' ? 'bg-destructive/80 hover:bg-destructive text-destructive-foreground' : ''
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
        {secondaryNavItems.length > 0 && (
            <>
                <Separator className="my-2" />
                 <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">Resident Menu</p>
                <nav className="flex flex-col gap-1">
                {secondaryNavItems.map((item) => (
                    <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        buttonVariants({
                        variant: pathname.startsWith(item.href) ? 'secondary' : 'ghost',
                        size: 'sm',
                        }),
                        'justify-start'
                    )}
                    >
                    {item.icon}
                    {item.title}
                    </Link>
                ))}
                </nav>
            </>
        )}
      </CardContent>
    </Card>
  );
}

    
