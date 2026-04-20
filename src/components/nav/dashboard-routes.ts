import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Dumbbell,
  Flame,
  Scale,
  Settings,
} from 'lucide-react';

/** Top nav + desktop — same routes as mobile tabs, different copy where noted. */
export const DASHBOARD_NAV_LINKS: { href: string; label: string }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workouts', label: 'Workouts' },
  { href: '/calories', label: 'Calories' },
  { href: '/weight', label: 'Weight / Stats' },
  { href: '/settings', label: 'Settings' },
];

/** Primary dashboard destinations — mobile floating tab bar (icons + short labels). */
export const DASHBOARD_MOBILE_TABS: {
  href: string;
  label: string;
  Icon: LucideIcon;
}[] = [
  { href: '/dashboard', label: 'Home', Icon: LayoutDashboard },
  { href: '/workouts', label: 'Workouts', Icon: Dumbbell },
  { href: '/calories', label: 'Calories', Icon: Flame },
  { href: '/weight', label: 'Weight', Icon: Scale },
  { href: '/settings', label: 'Settings', Icon: Settings },
];
