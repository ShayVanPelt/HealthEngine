import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import SplashScreen from '@/components/ui/SplashScreen';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // extends content behind notch/Dynamic Island
  themeColor: '#7c3aed',
};

export const metadata: Metadata = {
  title: 'HealthEngine',
  description: 'Track your fitness journey — workouts, calories, and weight.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'HealthEngine',
    statusBarStyle: 'black-translucent', // lets status bar overlay app (full-bleed look)
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png', // used as the iOS home screen icon
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className={inter.className}>
        <SplashScreen />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
