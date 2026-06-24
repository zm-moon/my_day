import Link from "next/link";
import type { PublicDayLog } from "@/lib/stats";
import { dateFromYmd, ymdFromDate } from "@/lib/date";

type HeatmapProps = {
  logs: PublicDayLog[];
};

const scoreClass: Record<number, string> = {
  0: "bg-slate-800/75 border-slate-700/70",
  1: "bg-emerald-950 border-emerald-800",
  2: "bg-emerald-800 border-emerald-600",
  3: "bg-emerald-500 border-emerald-300",
  4: "bg-neon border-lime-100 shadow-[0_0_10px_rgba(53,242,168,0.6)]"
};

function buildDays() {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 364);
  const days: string[] = [];

  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)) {
    days.push(ymdFromDate(cursor));
  }

  return days;
}

export function Heatmap({ logs }: HeatmapProps) {
  const byDate = new Map(logs.map((log) => [log.date, log]));
  const allDays = buildDays();
  const leadingBlanks = dateFromYmd(allDays[0]).getDay();
  const cells = [...Array.from({ length: leadingBlanks }, () => null), ...allDays];
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7)
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-panel/80 p-4 shadow-glow">
      <div className="flex min-w-max gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-rows-7 gap-1">
            {week.map((day, dayIndex) => {
              if (!day) {
                return <div key={`blank-${dayIndex}`} className="h-3 w-3 rounded-sm" />;
              }

              const log = byDate.get(day);
              const score = log?.score ?? 0;
              const title = log ? `${day} | mood: ${log.mood ?? "none"} | score: ${score}` : `${day} | no record`;

              return (
                <Link
                  key={day}
                  href={`/days/${day}`}
                  title={title}
                  aria-label={title}
                  className={`h-3 w-3 rounded-sm border transition duration-150 hover:scale-125 hover:ring-1 hover:ring-neon ${
                    scoreClass[score] ?? scoreClass[0]
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((score) => (
          <span key={score} className={`h-3 w-3 rounded-sm border ${scoreClass[score]}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
