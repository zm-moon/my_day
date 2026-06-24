import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8">
      <div className="rounded-lg border border-line bg-panel/85 p-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.35em] text-neon">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Not Found</h1>
        <p className="mt-3 text-slate-400">No log exists for this day.</p>
        <Link className="mt-6 inline-block text-sm text-neon hover:text-cyan" href="/">
          &lt; back to heatmap
        </Link>
      </div>
    </main>
  );
}
