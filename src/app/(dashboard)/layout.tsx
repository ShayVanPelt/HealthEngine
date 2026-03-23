import TopNav from '@/components/nav/TopNav';
import ToastProvider from '@/components/ui/ToastProvider';
import { PreferencesProvider } from '@/contexts/PreferencesContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <ToastProvider>
        <div className="min-h-screen bg-background">
          <TopNav />
          <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10">{children}</main>
        </div>
      </ToastProvider>
    </PreferencesProvider>
  );
}
