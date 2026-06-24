import { Heatmap } from "@/components/Heatmap";
import { RecentLogs } from "@/components/RecentLogs";
import { StatsCard } from "@/components/StatsCard";
import { prisma } from "@/lib/prisma";
import { calculateStats, recentLogs, toPublicDayLog } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const logs = (await prisma.dayLog.findMany({
    orderBy: {
      date: "asc"
    }
  })).map(toPublicDayLog);
  const stats = calculateStats(logs);
  const latestLogs = recentLogs(logs);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-line/70 pb-6">
        <p className="text-xs uppercase tracking-[0.35em] text-neon">daily recorder</p>
        <h1 className="mt-3 text-4xl font-semibold text-white sm:text-6xl">My Days</h1>
        <p className="mt-3 text-slate-400">A personal heatmap of my days.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Current streak" value={stats.currentStreak} />
        <StatsCard label="Total days" value={stats.totalDays} />
        <StatsCard label="This month" value={stats.monthDays} />
        <StatsCard label="This year" value={stats.yearDays} />
      </section>

      <section className="mt-8">
        <Heatmap logs={logs} />
      </section>

      <section className="mt-8">
        <RecentLogs logs={latestLogs} />
      </section>
    </main>
  );
}
