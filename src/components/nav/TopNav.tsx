'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workouts', label: 'Workouts' },
  { href: '/calories', label: 'Calories' },
  { href: '/weight', label: 'Weight / Stats' },
];

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
    <nav className="border-b border-black bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <span className="font-bold text-lg tracking-tight select-none">HealthEngine</span>

          {/* Nav links + logout */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-3 px-3 py-1.5 text-sm font-medium border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-40"
            >
              {loggingOut ? '...' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
