export function SkeletonGrid() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading AgroHub workspace">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/60"
          >
            <div className="h-3 w-24 rounded bg-stone-200 dark:bg-slate-700" />
            <div className="mt-4 h-7 w-20 rounded bg-stone-300 dark:bg-slate-600" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="h-80 animate-pulse rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/60"
          >
            <div className="h-40 w-full rounded-xl bg-stone-200 dark:bg-slate-800" />
            <div className="mt-4 h-4 w-2/3 rounded bg-stone-200 dark:bg-slate-700" />
            <div className="mt-2 h-3 w-1/2 rounded bg-stone-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
