'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workouts', label: 'Workouts' },
  { href: '/calories', label: 'Calories' },
  { href: '/weight', label: 'Weight / Stats' },
  { href: '/settings', label: 'Settings' },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <span className="font-black text-xl tracking-tight select-none">
            Health<span className="text-primary">Engine</span>
          </span>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-md transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-1"
            >
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>

          {/* Mobile right side */}
          <div className="flex sm:hidden items-center gap-1">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Toggle menu">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <SheetHeader className="px-5 pt-5 pb-3">
                  <SheetTitle className="text-left font-bold">
                    Health<span className="text-primary">Engine</span>
                  </SheetTitle>
                </SheetHeader>
                <Separator />
                <nav className="flex flex-col py-2">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'px-5 py-3 text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Separator className="my-2" />
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    disabled={loggingOut}
                    className="px-5 py-3 text-sm font-medium text-left text-muted-foreground hover:bg-accent transition-colors disabled:opacity-40"
                  >
                    {loggingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
