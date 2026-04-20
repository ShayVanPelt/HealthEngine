'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DASHBOARD_MOBILE_TABS } from '@/components/nav/dashboard-routes';

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileFloatingNav() {
  const pathname = usePathname();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      aria-label="Primary navigation"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-md px-3">
        <div
          className={cn(
            'flex items-stretch justify-between gap-0.5 rounded-[1.35rem] border border-border/80',
            'bg-card/92 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] backdrop-blur-xl',
            'dark:border-border/60 dark:bg-card/88 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)]',
          )}
        >
          {DASHBOARD_MOBILE_TABS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.05rem] px-1 py-2 transition-colors',
                  active
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground active:bg-muted/70',
                )}
              >
                <Icon
                  className="h-[22px] w-[22px] shrink-0"
                  strokeWidth={active ? 2.35 : 2}
                  aria-hidden
                />
                <span className="max-w-full truncate px-0.5 text-center text-[10px] font-bold leading-none tracking-tight">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
