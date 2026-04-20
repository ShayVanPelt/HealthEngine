import TopNav from '@/components/nav/TopNav';
import MobileFloatingNav from '@/components/nav/MobileFloatingNav';
import ToastProvider from '@/components/ui/ToastProvider';
import { PreferencesProvider } from '@/contexts/PreferencesContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <div className="min-h-screen bg-background">
          <TopNav />
          <main className="max-w-6xl mx-auto px-4 pt-6 pb-28 sm:py-10">{children}</main>
          <MobileFloatingNav />
        </div>
      </ToastProvider>
    </PreferencesProvider>
  );
}
