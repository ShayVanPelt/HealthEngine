'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DASHBOARD_NAV_LINKS } from '@/components/nav/dashboard-routes';

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <nav className="border-b border-border bg-background pt-[max(0px,env(safe-area-inset-top))] sm:pt-0">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-12 w-full items-center justify-start sm:h-16 sm:justify-between">
          <Link
            href="/dashboard"
            className="font-black text-lg sm:text-xl tracking-tight select-none"
            aria-label="HealthEngine home"
          >
            Health<span className="text-primary">Engine</span>
          </Link>

          {/* Desktop nav + sign out */}
          <div className="hidden sm:flex items-center gap-0.5">
            {DASHBOARD_NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-md transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
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
        </div>
      </div>
    </nav>
  );
}
