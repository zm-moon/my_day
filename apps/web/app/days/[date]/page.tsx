import Link from "next/link";
import { notFound } from "next/navigation";
import { DayCard } from "@/components/DayCard";
import { dateFromYmd, isYmd } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { toPublicDayLog } from "@/lib/stats";

type DayPageProps = {
  params: Promise<{
    date: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;

  if (!isYmd(date)) {
    notFound();
  }

  const log = await prisma.dayLog.findUnique({
    where: {
      date: dateFromYmd(date)
    }
  });

  if (!log) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <Link className="mb-6 w-fit text-sm text-neon hover:text-cyan" href="/">
        &lt; back to heatmap
      </Link>
      <DayCard log={toPublicDayLog(log)} />
    </main>
  );
}
