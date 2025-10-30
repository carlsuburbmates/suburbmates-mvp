'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  Users,
  MoreHorizontal,
  Search,
  CalendarDays,
  MessageSquare,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useRef, useState } from 'react'

export function BottomNav() {
  const pathname = usePathname()

  const items = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Civic', href: '/forums', icon: Users },
    { title: 'Vendors', href: '/vendors', icon: ShoppingCart },
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Contextual secondary actions per page
  const getActions = () => {
    if (pathname.startsWith('/vendors')) {
      return [
        { title: 'AI Search', href: '/vendors#ai-search', icon: Search },
        {
          title: 'Filters',
          href: '/vendors#marketplace-filter-list',
          icon: Filter,
        },
      ]
    }
    if (pathname.startsWith('/forums')) {
      return [
        {
          title: 'Discussions',
          href: '/forums?tab=discussions',
          icon: MessageSquare,
        },
        { title: 'Events', href: '/forums?tab=events', icon: CalendarDays },
      ]
    }
    if (pathname.startsWith('/dashboard')) {
      return [
        {
          title: 'Vendor Dashboard',
          href: '/dashboard/vendor',
          icon: LayoutGrid,
        },
        {
          title: 'Resident Dashboard',
          href: '/dashboard/resident',
          icon: LayoutGrid,
        },
      ]
    }
    return [
      { title: 'Search Vendors', href: '/vendors', icon: Search },
      { title: 'Browse Discussions', href: '/forums', icon: MessageSquare },
    ]
  }

  // Long-press to open the popover without toggling on click
  const [open, setOpen] = useState(false)
  const pressTimer = useRef<number | null>(null)
  const longPressTriggered = useRef(false)

  const handlePointerDown = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true
      setOpen(true)
    }, 350)
  }

  const clearPressTimer = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handlePointerUp = () => {
    clearPressTimer()
    // Allow click after this tick to read longPressTriggered correctly
    window.setTimeout(() => {
      longPressTriggered.current = false
    }, 0)
  }

  const handleClick = () => {
    if (longPressTriggered.current) {
      // Ignore click when long-press opened the popover
      return
    }
    setOpen((prev) => !prev)
  }

  return (
    <nav
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden rounded-2xl bg-foreground/90 text-background px-3 py-2 shadow-lg ring-1 ring-border backdrop-blur safe-bottom'
      )}
      aria-label="Primary mobile actions"
    >
      <ul className="flex items-center gap-2">
        {items.map(({ title, href, icon: Icon }) => (
          <li key={href} className="flex">
            <Link
              href={href}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md transition active:scale-[0.98]',
                isActive(href) ? 'bg-white/10' : 'hover:bg-white/10'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{title}</span>
            </Link>
          </li>
        ))}
        <li className="flex">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1 px-2 py-1 rounded-md transition hover:bg-white/10 active:scale-[0.98]"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={clearPressTimer}
                onPointerCancel={clearPressTimer}
                onClick={handleClick}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="text-xs">More</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="center"
              sideOffset={6}
              className="w-64 bg-background text-foreground"
            >
              <div className="grid gap-1">
                {getActions().map(({ title, href, icon: Icon }) => (
                  <Link
                    key={title}
                    href={href}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{title}</span>
                  </Link>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </li>
      </ul>
    </nav>
  )
}
