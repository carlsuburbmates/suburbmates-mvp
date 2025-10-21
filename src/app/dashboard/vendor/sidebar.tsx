
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, List, CreditCard } from 'lucide-react';
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
    title: 'Payments',
    href: '/dashboard/vendor/payments',
    icon: <CreditCard className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Orders',
    href: '#',
    icon: <List className="mr-2 h-4 w-4" />,
    disabled: true,
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
              href={item.disabled ? '#' : item.href}
              className={cn(
                buttonVariants({
                  variant: pathname === item.href ? 'default' : 'ghost',
                  size: 'default',
                }),
                'justify-start',
                item.disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : undefined}
            >
              {item.icon}
              {item.title}
              {item.disabled && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
