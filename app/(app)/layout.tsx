import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/supabase/guards";
import { getDashboardStats } from "@/lib/stats";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const stats = await getDashboardStats(user.id);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Nav email={user.email ?? ""} dueNow={stats.dueNow} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
  );
}
