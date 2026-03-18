import TopNav from '@/components/nav/TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <TopNav />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10">{children}</main>
    </div>
  );
}
