
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, List, CreditCard, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const navItems = [
  {
    title: 'Profile & Listings',
    href: '/dashboard/vendor',
    icon: <User className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Orders',
    href: '/dashboard/vendor/orders',
    icon: <ShoppingCart className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Payments',
    href: '/dashboard/vendor/payments',
    icon: <CreditCard className="mr-2 h-4 w-4" />,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Card className="sticky top-[140px]">
      <CardContent className="p-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: pathname === item.href ? 'default' : 'ghost',
                  size: 'default',
                }),
                'justify-start'
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
