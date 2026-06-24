type StatsCardProps = {
  label: string;
  value: number;
};

export function StatsCard({ label, value }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-line/80 bg-panel/80 p-4 shadow-glow backdrop-blur">
      <div className="text-2xl font-semibold text-neon">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
    </div>
  );
}
