import Link from "next/link";
import type { PublicDayLog } from "@/lib/stats";
import { formatMonthDayTime } from "@/lib/date";

type RecentLogsProps = {
  logs: PublicDayLog[];
};

function excerpt(value: string | null | undefined, length = 120): string {
  if (!value) return "";
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length)}...` : clean;
}

export function RecentLogs({ logs }: RecentLogsProps) {
  return (
    <section className="rounded-lg border border-line bg-panel/75 p-5 shadow-glow">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line/70 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Recent Days</h2>
          <p className="mt-1 text-sm text-slate-500">Last 30 days of logs.</p>
        </div>
        <span className="text-xs uppercase tracking-[0.18em] text-neon">{logs.length} entries</span>
      </div>

      {logs.length ? (
        <div className="divide-y divide-line/70">
          {logs.map((log) => (
            <Link
              key={log.id}
              href={`/days/${log.date}`}
              className="grid gap-3 py-4 transition hover:bg-ink/40 sm:grid-cols-[8rem_1fr]"
            >
              <div className="text-sm">
                <div className="font-semibold text-neon">{formatMonthDayTime(log.updatedAt)}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400 sm:block">
                  <span>{log.mood ?? "no mood"}</span>
                  <span className="sm:mt-1 sm:block">score {log.score}</span>
                </div>
              </div>
              <div>
                <p className="font-medium leading-6 text-slate-100">{excerpt(log.today) || "No today entry."}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  <span className="text-cyan">Tomorrow:</span> {excerpt(log.tomorrow) || "No plan."}
                </p>
                {log.notes ? (
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    <span className="text-neon">Note:</span> {excerpt(log.notes)}
                  </p>
                ) : null}
                {log.tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {log.tags.map((tag) => (
                      <span key={tag} className="rounded border border-line bg-ink/70 px-2 py-1 text-xs text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-slate-500">No logs in the last 30 days.</div>
      )}
    </section>
  );
}
