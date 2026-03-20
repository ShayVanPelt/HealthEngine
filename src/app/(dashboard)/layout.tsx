import TopNav from '@/components/nav/TopNav';
import ToastProvider from '@/components/ui/ToastProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10">{children}</main>
      </div>
    </ToastProvider>
  );
}
