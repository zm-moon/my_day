import type { PublicDayLog } from "@/lib/stats";

type DayCardProps = {
  log: PublicDayLog;
};

export function DayCard({ log }: DayCardProps) {
  return (
    <article className="rounded-lg border border-line bg-panel/85 p-5 shadow-glow">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <span>{log.date}</span>
        {log.mood ? <span className="rounded border border-cyan/30 px-2 py-0.5 text-cyan">{log.mood}</span> : null}
        <span className="rounded border border-neon/30 px-2 py-0.5 text-neon">score {log.score}</span>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section>
          <h2 className="text-sm uppercase tracking-[0.18em] text-slate-500">Today</h2>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-100">{log.today || "No entry."}</p>
        </section>
        <section>
          <h2 className="text-sm uppercase tracking-[0.18em] text-slate-500">Tomorrow</h2>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-100">{log.tomorrow || "No entry."}</p>
        </section>
      </div>
      {log.vibe ? (
        <section className="mt-5">
          <h2 className="text-sm uppercase tracking-[0.18em] text-slate-500">Vibe</h2>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-100">{log.vibe}</p>
        </section>
      ) : null}
      {log.tags.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {log.tags.map((tag) => (
            <span key={tag} className="rounded border border-line bg-ink/70 px-2 py-1 text-xs text-slate-300">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
